# Check Vercel Project Settings

Since the build succeeds but all routes return 404, please verify these settings in your Vercel project:

## Steps:

1. Go to: https://vercel.com/dashboard
2. Click on your project: `bnbcalc-press-kit`
3. Go to **Settings** tab
4. Click on **General**

## Check These Settings:

### Framework Preset
- Should be: **Next.js**
- If it's something else, click "Edit" and select "Next.js"

### Build & Development Settings

**Build Command:**
- Should be: `npm run build` (or auto-detected)
- Make sure it matches what's in your package.json

**Output Directory:**
- Should be: **empty/auto** (or `.next`)
- Should NOT be set to `out` or `dist`

**Install Command:**
- Should be: `npm install`

### Root Directory
- Should be: **empty** (root of the repo)
- Unless your Next.js app is in a subdirectory

## If Framework Preset is Wrong:

1. Click "Edit" next to Framework Preset
2. Select "Next.js"
3. Save
4. This will trigger a new deployment

## Alternative: Check in Project Settings

If you can't find these settings:
1. Go to your project
2. Click **Settings** → **General**
3. Look for "Framework" section
4. Verify it says "Next.js"

## After Making Changes:

After updating the Framework Preset to "Next.js", Vercel should automatically redeploy. Wait for the deployment to complete and test again.



