# kaniko-standalone

# Building and Packaging
1. install dependancies
   ```
     npm install
   ```
3. Build the action
  ```
    npm run build
  ```
4. the compiled files will be in the dist/ directory

Example Usage

```
name: Enhanced Kaniko Usage
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Kaniko with System Emulation
      uses: your-username/kaniko-standalone-action@v1
      with:
        version: 'v1.9.1'
        emulate-system: 'true'
      
    - name: Build and Push with Emulated System
      run: |
        mkdir -p /kaniko/.docker
        echo "{\"auths\":{\"${{ secrets.REGISTRY_URL }}\":{\"auth\":\"$(echo -n ${{ secrets.REGISTRY_USERNAME }}:${{ secrets.REGISTRY_PASSWORD }} | base64)\"}}" > /kaniko/.docker/config.json
        
        export ROOTFS=$(mktemp -d)
        mkdir -p $ROOTFS/{proc,sys,dev,etc,tmp}
        
        executor \
          --dockerfile=Dockerfile \
          --context=${{ github.workspace }} \
          --destination=${{ secrets.REGISTRY_URL }}/my-image:latest \
          --verbosity=info \
          --use-new-run \
          --rootfs=$ROOTFS
```
