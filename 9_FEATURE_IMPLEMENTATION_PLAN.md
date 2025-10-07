## 🚀 9 MAJOR FEATURES IMPLEMENTATION PLAN - COMPREHENSIVE ROADMAP

### **IMPLEMENTATION PRIORITY ORDER**

**User Request**: Implement 9 major features immediately with defined priority order:
1. **Style selection + Gemini integration** (HIGH)
2. **Full gallery + downloads** (HIGH)  
3. **Gallery page + pending display** (HIGH)
4. **24-hour photo lifecycle** (MEDIUM)

### **CLARIFICATION RESOLVED**
**Gemini 2.5 Flash "Nano Banana"** = Option A: Enhancing Astria prompts (AI-generated descriptions)
- Takes user style selection and generates optimized prompts for Astria API
- NOT direct image generation, but prompt enhancement

---

## 📋 PHASE 1: PHOTO GENERATION ENHANCEMENT (HIGH PRIORITY)

### **Feature 1: Photo Style Selection UI**
- **Location**: `/generate` page (`HeadshotGenerator.tsx`)
- **Implementation**:
  - Add RadioGroup for 3 style options
  - Professional/Corporate: "full face frontal only. no side profiles" negative prompt
  - Doctor: "full face frontal only. no side profiles" negative prompt  
  - Boudoir: "mid body shot, shirtless if man. subtle sexy lingerie if woman. no side profiles" negative prompt
- **Files**: `src/pages/HeadshotGenerator.tsx`

### **Feature 2: Gemini 2.5 Flash Prompt Enhancement**
- **Purpose**: Use Gemini to enhance user prompts before sending to Astria
- **Implementation**:
  - Integrate Gemini 2.5 Flash "Nano Banana" API
  - Take style selection + user input → generate optimized Astria prompt
  - Replace current prompt system with Gemini-enhanced prompts
- **Files**: `supabase/functions/generate-headshot/index.ts`

### **Feature 3: Negative Prompts for Astria**
- **Implementation**:
  - Add `negative_prompt` parameter to Astria API calls
  - Support style-specific negative prompts
  - Ensure "no side profiles" is enforced for all styles
- **Files**: `supabase/functions/generate-headshot/index.ts`

---

## 🖼️ PHASE 2: GALLERY ENHANCEMENT (HIGH PRIORITY)

### **Feature 4: Full Gallery on Overview**
- **Current Issue**: Overview shows only 6 images
- **Implementation**:
  - Modify Overview page to display all user images
  - Add pagination or infinite scroll for large collections
  - Maintain performance with large image sets
- **Files**: `src/pages/Overview.tsx`

### **Feature 5: Multi-Resolution Downloads**
- **Implementation**:
  - Add download dropdown with resolution options: 4K/1080p/720p
  - Generate multiple resolutions server-side or client-side
  - Provide download links for each resolution
- **Files**: Gallery components, download utilities

### **Feature 6: Dedicated Gallery Page**
- **Current Issue**: Gallery page doesn't exist
- **Implementation**:
  - Create new `/gallery` route
  - Full-featured gallery with grid layout
  - Image viewing, downloading, management features
  - Search and filter capabilities
- **Files**: `src/pages/Gallery.tsx` (new), routing config

### **Feature 7: Gallery Link on /generate Page**
- **Implementation**:
  - Add navigation link to Gallery page from `/generate`
  - Include in header/navigation or as prominent button
  - Improve user flow between generation and viewing
- **Files**: `src/pages/HeadshotGenerator.tsx`

---

## ⏱️ PHASE 3: IMAGE MANAGEMENT (MEDIUM PRIORITY)

### **Feature 8: Pending Images Display Section**
- **Implementation**:
  - Show images currently being processed
  - Real-time status updates (generating, processing, completed)
  - Progress indicators and estimated completion times
  - Separate section from completed images
- **Files**: Gallery components, status management

### **Feature 9: 24-Hour Image Lifecycle & Auto-Cleanup**
- **Implementation**:
  - Database trigger or cron job for 24-hour deletion
  - User notification before deletion (optional)
  - Cleanup from both database and storage
  - Configurable lifecycle duration
- **Files**: Database migration, cleanup functions, edge functions

---

## 🛠️ TECHNICAL IMPLEMENTATION DETAILS

### **API Changes Required:**

```javascript
// Enhanced generate request
{
  action: 'generate_image',
  model_id: modelId,
  style: 'professional|doctor|boudoir', // NEW
  gender: 'man|woman', // NEW (boudoir only)  
  prompt: userPrompt,
  enhanced_prompt: geminiEnhancedPrompt, // NEW
  negative_prompt: styleNegativePrompt, // NEW
  num_images: 4
}
```

### **New Routes Required:**
- `/gallery` - Dedicated gallery page
- API endpoints for multi-resolution downloads
- Cleanup endpoints for lifecycle management

### **Database Schema Updates:**
```sql
-- Add image lifecycle tracking
ALTER TABLE images ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE images ADD COLUMN expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours';
ALTER TABLE images ADD COLUMN resolution_variants JSONB; -- Store multiple resolution URLs
```

### **File Structure Changes:**
```
src/pages/
  ├── Gallery.tsx (NEW)
  ├── HeadshotGenerator.tsx (MODIFY - add styles + gallery link)
  └── Overview.tsx (MODIFY - show all images)

src/components/
  ├── gallery/ (NEW FOLDER)
  │   ├── ImageGrid.tsx
  │   ├── ImageViewer.tsx
  │   ├── DownloadOptions.tsx
  │   └── PendingImages.tsx
  └── ui/ (existing)

supabase/functions/
  ├── generate-headshot/index.ts (MODIFY - Gemini + negative prompts)
  ├── cleanup-images/ (NEW - 24h lifecycle)
  └── resize-images/ (NEW - multi-resolution)
```

---

## 📊 IMPLEMENTATION CHECKLIST

### **Phase 1: Photo Generation Enhancement**
- [ ] **1.1** Implement photo style selection UI on /generate page
- [ ] **1.2** Integrate Gemini 2.5 Flash "Nano Banana" for prompt enhancement
- [ ] **1.3** Add negative prompts support to Astria API calls
- [ ] **1.4** Test all 3 style options (professional/doctor/boudoir)
- [ ] **1.5** Verify negative prompts prevent side profiles

### **Phase 2: Gallery Enhancement**  
- [ ] **2.1** Expand Overview gallery to show all images
- [ ] **2.2** Implement multi-resolution download options
- [ ] **2.3** Create dedicated Gallery page (/gallery route)
- [ ] **2.4** Add Gallery link to /generate page
- [ ] **2.5** Test gallery performance with large image sets

### **Phase 3: Image Management**
- [ ] **3.1** Implement pending images display section
- [ ] **3.2** Create 24-hour image lifecycle system
- [ ] **3.3** Set up auto-cleanup functionality
- [ ] **3.4** Test lifecycle management end-to-end

---

## 🎯 SUCCESS CRITERIA

**Phase 1 Complete When:**
- Users can select 3 different photo styles on /generate page
- Gemini 2.5 Flash enhances prompts before sending to Astria
- Negative prompts successfully prevent side profile images
- All style-specific prompts generate appropriate results

**Phase 2 Complete When:**
- Overview shows all user images (not limited to 6)
- Users can download images in 4K/1080p/720p resolutions
- Dedicated /gallery page exists with full functionality
- Gallery link is accessible from /generate page

**Phase 3 Complete When:**
- Users can see pending/processing images separately
- Images automatically delete after 24 hours
- Cleanup system works reliably without manual intervention
- User experience remains smooth during lifecycle transitions

---

## 🚀 IMMEDIATE NEXT STEPS

1. **Start with Feature 1**: Photo style selection UI (fastest win)
2. **Parallel development**: Begin Gemini integration research
3. **Gallery assessment**: Audit current gallery limitations  
4. **Database planning**: Design schema changes for lifecycle management

**Estimated Timeline**: 2-3 weeks for full implementation
**Priority**: All features marked as critical for user experience enhancement