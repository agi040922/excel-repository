<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1pwjSXQQcMeSbryXozkRzrS91hGeIvISH

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cloudflare R2 Storage Setup

This project supports Cloudflare R2 for file storage. To enable R2 integration:

### 1. Environment Variables

Add the following to your `.env.local`:

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=excel-vision-uploads
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### 2. R2 CORS Configuration

Configure CORS in your R2 bucket to allow uploads from your application:

1. Go to Cloudflare Dashboard → R2 → Your Bucket → Settings
2. Add the following CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

**Important**: Replace `your-production-domain.com` with your actual production domain.

### 3. Usage

#### Using the Hook

```typescript
import { useR2Upload } from '@/hooks/useR2Upload';

function MyComponent() {
  const { uploadFile, isUploading, progress, error } = useR2Upload();

  const handleUpload = async (file: File) => {
    const result = await uploadFile(file, 'uploads');
    console.log('Uploaded URL:', result.publicUrl);
  };

  return (
    <div>
      {isUploading && <p>Progress: {progress}%</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

#### Using FileUploader with R2

```typescript
<FileUploader
  title="Upload Files"
  subtitle="Drag and drop files here"
  accept="image/*"
  multiple
  enableR2Upload={true}
  r2Folder="uploads"
  onUpload={(results) => {
    results.forEach(result => {
      console.log('File:', result.file);
      console.log('Uploaded URL:', result.uploadedUrl);
    });
  }}
/>
```
