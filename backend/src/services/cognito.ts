import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  GetUserCommand,
  AdminGetUserCommand,
  GlobalSignOutCommand,
  AdminDeleteUserCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider'

import {
  RegisterRequest,
  LoginRequest,
  ConfirmSignUpRequest,
  AuthResponse,
  RegisterResponse,
  CognitoUser
} from '../types'

export class CognitoService {
  private client: CognitoIdentityProviderClient
  private userPoolId: string
  private clientId: string

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.REGION || 'eu-west-1'
    })
    
    this.userPoolId = process.env.COGNITO_USER_POOL_ID!
    this.clientId = process.env.COGNITO_CLIENT_ID!
    
    if (!this.userPoolId || !this.clientId) {
      throw new Error('Missing Cognito configuration')
    }
  }

  /**
   * Register a new user in Cognito
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: userData.email,
        Password: userData.password,
        UserAttributes: [
          {
            Name: 'email',
            Value: userData.email
          },
          ...(userData.username ? [{
            Name: 'preferred_username',
            Value: userData.username
          }] : [])
        ]
      })

      const response = await this.client.send(command)

      return {
        user: {
          id: response.UserSub!,
          email: userData.email,
          emailVerified: false,
          username: userData.username,
          createdAt: new Date().toISOString()
        },
        message: 'Usuario registrado exitosamente',
        requiresConfirmation: !response.UserConfirmed
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      throw error
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: credentials.email,
          PASSWORD: credentials.password
        }
      })

      const response = await this.client.send(command)

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed')
      }

      const userInfo = await this.getUserInfo(response.AuthenticationResult.AccessToken!)

      return {
        user: {
          id: userInfo.sub,
          email: userInfo.email,
          emailVerified: userInfo.email_verified,
          username: userInfo.username,
          createdAt: userInfo.createdAt || new Date().toISOString()
        },
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        tokenType: response.AuthenticationResult.TokenType || 'Bearer',
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600
      }
    } catch (error: any) {
      console.error('Error en login:', error)
      throw error
    }
  }

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<Pick<AuthResponse, 'accessToken' | 'idToken' | 'tokenType' | 'expiresIn'>> {
    try {
      console.log('🔄 Refreshing tokens...')

      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken
        }
      })

      const response = await this.client.send(command)

      if (!response.AuthenticationResult) {
        throw new Error('No authentication result received from refresh')
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        tokenType: response.AuthenticationResult.TokenType || 'Bearer',
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600
      }
    } catch (error: any) {
      throw new Error(`Failed to refresh tokens: ${error.message}`)
    }
  }

  /**
   * Confirm user registration with code
   */
  async confirmSignUp(confirmData: ConfirmSignUpRequest): Promise<{ message: string }> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: confirmData.email,
        ConfirmationCode: confirmData.confirmationCode
      })

      await this.client.send(command)

      return {
        message: 'Cuenta confirmada exitosamente'
      }
    } catch (error: any) {
      console.error('Error en confirmación:', error)
      throw error
    }
  }

  /**
   * Get user info from token
   */
  async getUserInfo(accessToken: string): Promise<CognitoUser & { createdAt?: string }> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken
      })

      const response = await this.client.send(command)

      const attributes = response.UserAttributes || []
      const getAttr = (name: string) => attributes.find((attr: any) => attr.Name === name)?.Value

      return {
        sub: response.Username!,
        email: getAttr('email') || '',
        email_verified: getAttr('email_verified') === 'true',
        username: getAttr('preferred_username'),
        name: getAttr('name'),
        createdAt: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Error obteniendo info de usuario:', error)
      throw error
    }
  }

  /**
   * Get user info by email (admin)
   */
  async getUserByEmail(email: string): Promise<CognitoUser & { createdAt?: string }> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email
      })

      const response = await this.client.send(command)
      const attributes = response.UserAttributes || []
      const getAttr = (name: string) => attributes.find((attr: any) => attr.Name === name)?.Value

      return {
        sub: response.Username!,
        email: getAttr('email') || '',
        email_verified: getAttr('email_verified') === 'true',
        username: getAttr('preferred_username'),
        name: getAttr('name'),
        createdAt: new Date().toISOString()
      }
    } catch (error: any) {
      console.error('Error obteniendo usuario por email:', error)
      throw error
    }
  }

  /**
   * Close all user sessions
   */
  async globalSignOut(accessToken: string): Promise<{ message: string }> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken
      })

      await this.client.send(command)

      return {
        message: 'Sesión cerrada exitosamente'
      }
    } catch (error: any) {
      console.error('Error en logout:', error)
      throw error
    }
  }

  /**
   * Delete user (admin) - for testing
   */
  async deleteUser(email: string): Promise<{ message: string }> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: email
      })

      await this.client.send(command)

      return {
        message: 'Usuario eliminado exitosamente'
      }
    } catch (error: any) {
      console.error('Error eliminando usuario:', error)
      throw error
    }
  }
}

export const cognitoService = new CognitoService() 