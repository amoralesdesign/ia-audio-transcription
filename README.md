## Clone repository

```bash
git clone https://github.com/amoralesdesign/ia-audio-transcription.git
```

## How to test this project

```bash
cd frontend
npm install

```

### Local

Download packages:

```bash
cd frontend
npm install

```

> [!NOTE]  
> To facilitate testing, the .env files have been uploaded. 

Run project:
```bash
cd frontend
npm run dev

```

> [!NOTE]  
> Account with data: amoralesdesign@gmail.com  Password: Prueba12)

### AWS serverless deplo (Not required for test)

For Deploy Cognito in AWS:
````bash
cd backend
npm install

npx sls deploy --stage dev --region eu-west-1

```

Next times:
```bash
npm run deploy

```