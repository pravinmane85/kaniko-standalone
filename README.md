# kaniko-standalone

This implementation provides complete system emulation while maintaining the standalone nature of Kaniko, suitable for environments where container isolation isn't available.

## Key System Emulation Components:

1. **Pre-built System Files**:
   - Included in the release package (`/system` directory)
   - Contains minimal `/proc`, `/dev`, `/sys`, and `/etc` structures

2. **Runtime Emulation**:
   - Creates temporary root filesystem
   - Copies necessary system files
   - Uses Kaniko's `--rootfs` and `--use-new-run` flags

3. **Isolation**:
   - All system emulation happens in temp directories
   - No modification to host system files
   - Cleaned up automatically after build

## Customization Options:

1. To add more system files:
```bash
# In build workflow
echo "myfilecontent" > kaniko-release/system/etc/myconfig
```

2. To disable emulation:
```yaml
with:
  emulate-system: 'false'
```

3. To extend emulated filesystem:
```bash
# In action steps
mkdir -p $ROOTFS/usr/lib
cp -r /usr/lib/x86_64-linux-gnu $ROOTFS/usr/lib/
```

# Building and Packaging
Just run the action build-kaniko-release

# Example Usage

```
name: Build and Push to ECR
on: [push]

env:
  AWS_REGION: 'us-east-1'
  ECR_REPO: 'your-ecr-repo-name'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # Needed for AWS OIDC auth
      contents: read
      
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::123456789012:role/your-github-actions-role
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to ECR
      id: login-ecr
      run: |
        aws ecr get-login-password | docker login \
          --username AWS \
          --password-stdin ${{ format('{0}.dkr.ecr.{1}.amazonaws.com', steps.login-ecr.outputs.account, env.AWS_REGION) }}
        echo "registry=${{ format('{0}.dkr.ecr.{1}.amazonaws.com', steps.login-ecr.outputs.account, env.AWS_REGION) }}" >> $GITHUB_OUTPUT
      env:
        AWS_ACCOUNT_ID: '123456789012'

    - name: Build with Kaniko
      uses: your-username/kaniko-standalone-action@v1
      with:
        version: 'v1.12.0'
        destination: '${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPO }}:${{ github.sha }}'
        emulate-system: 'true'
      env:
        REGISTRY_HOST: ${{ steps.login-ecr.outputs.registry }}
        REGISTRY_USERNAME: 'AWS'
        REGISTRY_PASSWORD: ${{ steps.login-ecr.outputs.token }}
```
