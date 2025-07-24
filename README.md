## How to test this project

```
cd frontend
npm install

```

### Local

Download packages:

```
cd frontend
npm install

```

> [!NOTE]  
> Note: To facilitate testing, the .env files have been uploaded. 

Run project:
```
cd frontend
npm run dev

```

> [!WARNING]  
> Note: First time fails to recognize typescript syntax, restart it a second time and it will not fail.

### AWS serverless deploy

For Deploy Cognito in AWS:
```
cd backend
npm install

npx sls deploy --stage dev --region eu-west-1

```

Next times:
```
npm run deploy

```