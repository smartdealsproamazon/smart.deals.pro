# Setup Firebase Workload Identity Federation

## Step 1: Set Environment Variables
```bash
export PROJECT_ID="smart-deals-pro"
export REPO_OWNER="smartdealsproamazon"
export REPO_NAME="smart.deals.pro"
```

## Step 2: Create Workload Identity Pool
```bash
gcloud iam workload-identity-pools create "github-actions-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

## Step 3: Create OIDC Provider
```bash
gcloud iam workload-identity-pools providers create-oidc "github-actions-oidc" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
  --attribute-condition="assertion.repository_owner=='${REPO_OWNER}'"
```

## Step 4: Create or Get Service Account
```bash
# Create service account (if it doesn't exist)
gcloud iam service-accounts create firebase-deployer \
  --project="${PROJECT_ID}" \
  --display-name="Firebase Deployer"

# Get the service account email
export SERVICE_ACCOUNT_EMAIL="firebase-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
```

## Step 5: Grant Firebase Admin Role
```bash
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/firebase.admin"
```

## Step 6: Get Identity Provider Name
```bash
export WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe "github-actions-oidc" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)")

echo "FIREBASE_IDENTITY_PROVIDER: ${WORKLOAD_IDENTITY_PROVIDER}"
```

## Step 7: Allow GitHub Actions to Impersonate Service Account
```bash
gcloud iam service-accounts add-iam-policy-binding \
  "${SERVICE_ACCOUNT_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_PROVIDER}/attribute.repository/${REPO_OWNER}/${REPO_NAME}"
```

## Step 8: Display GitHub Secrets
```bash
echo "=== ADD THESE TO GITHUB SECRETS ==="
echo "FIREBASE_PROJECT_ID: ${PROJECT_ID}"
echo "FIREBASE_IDENTITY_PROVIDER: ${WORKLOAD_IDENTITY_PROVIDER}"
echo "FIREBASE_SERVICE_ACCOUNT: ${SERVICE_ACCOUNT_EMAIL}"
```