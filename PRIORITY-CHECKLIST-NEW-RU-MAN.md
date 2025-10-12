# 'new Ru man' Model Integration - Priority Checklist

**Goal:** Successfully integrate the 'new Ru man' model for seamless headshot generation using a simplified UI and backend configuration.

**Current Status:**
- Frontend: ✅ Model dropdown removed, single Generate button added
- Backend: ✅ Database lookup bypassed, DEFAULT_ASTRIA_TUNE_ID support added
- Code: ✅ Committed and pushed to GitHub (commit a33969c)
- Build: ✅ Frontend built successfully

## 🎯 PRIORITY LEVELS

- **P0: Critical - Blocking Core Functionality** (Must be resolved immediately)
- **P1: High - Essential for User Experience** (Address ASAP)
- **P2: Medium - Important Improvements** (Address after P0/P1)
- **P3: Low - Nice-to-Have Enhancements** (Address when resources are available)

## 📝 CHECKLIST

### Phase 1: Configuration & Deployment (P0)

- [ ] **(P0) Obtain 'new Ru man' Tune ID from Astria Dashboard**
    - [ ]  If USER hasn't provided:
        - [ ]  Contact USER to request the tune_id.
        - [ ]  Provide instructions:
            -  Go to https://www.astria.ai/tunes
            -  Find the 'new Ru man' model.
            -  Copy the ID from the URL or model details page.
        - [ ]  If user cannot get tune_id themselves, attempt to retrieve it via Astria API using provided API key (requires direct API access).
- [ ] **(P0) Set `DEFAULT_ASTRIA_TUNE_ID` in Supabase Secrets**
    - [ ]  Execute the following command in the terminal:
        ```bash
        supabase secrets set DEFAULT_ASTRIA_TUNE_ID="YOUR_TUNE_ID_HERE"
        ```
        (Replace `YOUR_TUNE_ID_HERE` with the actual tune ID)
    - [ ]  Verify the secret was set correctly:
        ```bash
        supabase secrets list
        ```
        Confirm `DEFAULT_ASTRIA_TUNE_ID` is present and has the correct value.

- [ ] **(P0) Deploy `generate-headshot` Edge Function**
    - [ ]  Navigate to the project directory in the terminal:
        ```bash
        cd /Users/dimaglinskii/Documents/GitHub/myphoto
        ```
    - [ ]  Deploy the edge function:
        ```bash
        supabase functions deploy generate-headshot --project-ref imzlzufdujhcbebibgpj
        ```
    - [ ]  Note the version number of the deployed function.

### Phase 2: Verification & Testing (P0)

- [ ] **(P0) Verify Deployment in Supabase Dashboard**
    - [ ]  Go to Supabase Dashboard -> Functions -> `generate-headshot`
    - [ ]  Confirm the function is deployed and active.
    - [ ]  Check the function's version number matches the deployed version.

- [ ] **(P0) End-to-End Testing**
    - [ ]  Navigate to the `/generate` page in the application.
    - [ ]  Click the "Generate Headshots Now" button.
    - [ ]  Observe the behavior.

- [ ] **(P0) Check Supabase Function Logs**
    - [ ]  Go to Supabase Dashboard -> Functions -> `generate-headshot` -> Logs
    - [ ]  Look for the following log messages:
        -   `✅ Using configured Astria tune_id: YOUR_TUNE_ID` (Replace `YOUR_TUNE_ID` with the actual tune ID)
        -   Absence of any error messages, especially `❌ Model not found or access denied` or `PGRST116` errors.
    - [ ]  Confirm that image generation requests are being sent to the Astria API.

- [ ] **(P0) Verify Image Generation**
    - [ ]  Confirm that headshots are being generated successfully.
    - [ ]  Verify the generated images are displayed in the application.
    - [ ]  Inspect the browser's developer console for any JavaScript errors.

### Phase 3: Documentation & Refinement (P1)

- [ ] **(P1) Update `project-tasks.mdc` with Completion Status**
    - [ ]  Mark all tasks in this checklist as complete.
    - [ ]  Add a summary of the integration process and results.
    - [ ]  Include any relevant troubleshooting steps or observations.

- [ ] **(P1) Create/Update Troubleshooting Guide**
    - [ ]  Document common issues and their solutions in `DEPLOYMENT-INSTRUCTIONS.md` or a separate `TROUBLESHOOTING.md` file.
    - [ ]  Include steps to check environment variables, verify deployment, and analyze logs.

- [ ] **(P2) Consider Admin Dashboard Configuration**
    - [ ]  Explore adding a configuration option in the admin dashboard to allow easy selection of the `tune_id` instead of relying solely on environment variables.
    - [ ]  Assess the complexity and potential benefits of this enhancement.

### Success Criteria

- [ ]  The `DEFAULT_ASTRIA_TUNE_ID` environment variable is set correctly in Supabase Secrets.
- [ ]  The `generate-headshot` edge function is deployed successfully.
- [ ]  Clicking the "Generate Headshots Now" button triggers image generation using the 'new Ru man' model.
- [ ]  The Supabase function logs confirm the `tune_id` is being used.
- [ ]  No `PGRST116` or other error messages are present in the function logs.
- [ ]  Generated headshots are displayed correctly in the application.
- [ ]  The `project-tasks.mdc` file is updated with the completion status.
- [ ]  A troubleshooting guide is created/updated with common issues and solutions.
