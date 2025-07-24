import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { Transcription, PaginatedResponse } from '../types'
import { v4 as uuidv4 } from 'uuid'

const client = new DynamoDBClient({ region: process.env.REGION })
const docClient = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.DYNAMODB_TRANSCRIPTIONS_TABLE!

export const dynamodbService = {
  /**
   * Create a new transcription
   */
  async createTranscription(
    userId: string, 
    transcriptionData: Omit<Transcription, 'transcriptionId' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Transcription> {
    const transcriptionId = uuidv4()
    const now = new Date().toISOString()
    
    const transcription: Transcription = {
      transcriptionId,
      userId,
      ...transcriptionData,
      createdAt: now,
      updatedAt: now
    }

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: transcription
    }))

    return transcription
  },

  /**
   * Get transcription by ID
   */
  async getTranscription(userId: string, transcriptionId: string): Promise<Transcription | null> {
    const response = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        transcriptionId
      }
    }))

    if (!response.Item) {
      return null
    }

    return response.Item as Transcription
  },

  /**
   * Update transcription status
   */
  async updateTranscriptionStatus(
    userId: string, 
    transcriptionId: string, 
    updates: Partial<Pick<Transcription, 'status' | 'transcriptText' | 'duration' | 'metadata'>>
  ): Promise<Transcription> {
    const now = new Date().toISOString()
    
    const updateExpressions: string[] = ['#updatedAt = :updatedAt']
    const expressionAttributeValues: any = { ':updatedAt': now }
    const expressionAttributeNames: any = { '#updatedAt': 'updatedAt' }
    
    if (updates.status) {
      updateExpressions.push('#status = :status')
      expressionAttributeValues[':status'] = updates.status
      expressionAttributeNames['#status'] = 'status'
    }
    
    if (updates.transcriptText) {
      updateExpressions.push('#transcriptText = :transcriptText')
      expressionAttributeValues[':transcriptText'] = updates.transcriptText
      expressionAttributeNames['#transcriptText'] = 'transcriptText'
    }
    
    if (updates.duration) {
      updateExpressions.push('#duration = :duration')
      expressionAttributeValues[':duration'] = updates.duration
      expressionAttributeNames['#duration'] = 'duration'
    }
    
    if (updates.metadata) {
      updateExpressions.push('#metadata = :metadata')
      expressionAttributeValues[':metadata'] = updates.metadata
      expressionAttributeNames['#metadata'] = 'metadata'
    }

    const response = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        transcriptionId
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }))

    return response.Attributes as Transcription
  },

  /**
   * List transcription of the user with pagination
   */
  async getUserTranscriptions(
    userId: string, 
    limit: number = 10, 
    lastEvaluatedKey?: string
  ): Promise<PaginatedResponse<Transcription>> {
    const queryParams: any = {
      TableName: TABLE_NAME,
      IndexName: 'UserDateIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: limit,
      ScanIndexForward: false
    }

    if (lastEvaluatedKey) {
      queryParams.ExclusiveStartKey = JSON.parse(
        Buffer.from(lastEvaluatedKey, 'base64').toString()
      )
    }

    const response = await docClient.send(new QueryCommand(queryParams))

    const items = (response.Items || []) as Transcription[]

    const hasMore = !!response.LastEvaluatedKey
    const nextPage = hasMore ? 
      Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64') : 
      undefined

    return {
      items,
      totalCount: Number(response.Count) || 0,
      page: 1,
      limit,
      hasMore,
      nextPage
    }
  },

  /**
   * Delete transcription
   */
  async deleteTranscription(userId: string, transcriptionId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        transcriptionId
      }
    }))
  },


} 