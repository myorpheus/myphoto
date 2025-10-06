## ✨ PHOTO GENERATION STYLE ENHANCEMENT - COMPREHENSIVE CHECKLIST

### **FEATURE REQUEST ANALYSIS**

**Request**: Update Astria prompt system and add photo generation style selection on /generate page

**Requirements Breakdown:**
1. **Prompt System Update**: Use Gemini 2.5 Flash - Nano Banana for Astria prompts
2. **Style Selection UI**: Add 3 photo generation style options to /generate page
3. **Professional/Corporate**: Full face frontal headshot with negative prompt
4. **Doctor Headshot**: Medical professional headshot with negative prompt  
5. **Boudoir Style**: Mid-body shot with gender detection and appropriate styling

### **PRIORITY INTEGRATION**

**Classification**: CRITICAL - Core generation functionality enhancement
**Priority Level**: Phase 0 (Immediate implementation)
**Dependencies**: Astria integration must be working
**Impact**: High - Directly improves user generation experience

### **DETAILED IMPLEMENTATION CHECKLIST**

#### **Phase 1: Prompt System Update (High Priority)**
- [ ] **1.1 Update Astria prompt system to use Gemini 2.5 Flash - Nano Banana**
  - [ ] Investigate current prompt generation in `supabase/functions/generate-headshot/index.ts`
  - [ ] Modify prompt system to use specified Gemini model
  - [ ] Test prompt generation with new model

#### **Phase 2: UI Enhancement (High Priority)**  
- [ ] **2.1 Add style selection UI to `/generate` page**
  - [ ] Modify `src/pages/HeadshotGenerator.tsx` 
  - [ ] Add RadioGroup component for style selection
  - [ ] Create state management for selected style
  - [ ] Design responsive UI for style options

- [ ] **2.2 Implement gender selection for Boudoir style**
  - [ ] Add conditional gender selection UI (Man/Woman buttons)
  - [ ] Show gender selection only when Boudoir style is selected
  - [ ] Store gender selection in component state

#### **Phase 3: Style Implementation (High Priority)**
- [ ] **3.1 Professional/Corporate headshot style**
  - [ ] Implement prompt: "professional, corporate headshot, full face frontal only"
  - [ ] Add negative prompt: "no side profiles"
  - [ ] Test generation quality and consistency

- [ ] **3.2 Doctor headshot style**  
  - [ ] Implement prompt: "doctor headshot, full face frontal only"
  - [ ] Add negative prompt: "no side profiles"
  - [ ] Test medical professional appearance quality

- [ ] **3.3 Boudoir style with gender detection**
  - [ ] Male prompt: "boudoir, mid body shot, shirtless if man"
  - [ ] Female prompt: "boudoir, mid body shot, subtle, sexy lingerie, if woman detected"
  - [ ] Universal negative prompt: "no side profiles"
  - [ ] Test appropriate styling for both genders

#### **Phase 4: Backend Integration (Medium Priority)**
- [ ] **4.1 Negative prompt handling**
  - [ ] Update `generate-headshot` edge function to accept negative_prompt parameter
  - [ ] Modify Astria API calls to include negative prompts
  - [ ] Test negative prompt effectiveness

- [ ] **4.2 Style-specific prompt logic**
  - [ ] Implement prompt building based on selected style
  - [ ] Add gender-based logic for boudoir style
  - [ ] Ensure proper prompt formatting for Astria API

#### **Phase 5: Testing & Validation (Medium Priority)**
- [ ] **5.1 Comprehensive style testing**
  - [ ] Test all 3 styles with various model types
  - [ ] Validate negative prompt effectiveness (no side profiles)
  - [ ] Check gender detection accuracy for boudoir style

- [ ] **5.2 User experience testing**
  - [ ] Test UI responsiveness and usability
  - [ ] Verify proper error handling for each style
  - [ ] Validate loading states during generation

#### **Phase 6: Documentation (Low Priority)**
- [ ] **6.1 Update project documentation**
  - [ ] Document new style options in user guides
  - [ ] Update API documentation for new parameters
  - [ ] Create style comparison examples

### **TECHNICAL IMPLEMENTATION DETAILS**

#### **Files to Modify:**

1. **`src/pages/HeadshotGenerator.tsx`**
   - Add RadioGroup for style selection
   - Add conditional gender selection UI
   - Update state management for new options
   - Modify API calls to include style parameters

2. **`supabase/functions/generate-headshot/index.ts`**
   - Accept style and gender parameters
   - Implement prompt building logic
   - Add negative prompt support
   - Update Astria API integration

3. **UI Components (if needed)**
   - Style selection component
   - Gender selection component
   - Enhanced generation form

#### **API Changes Required:**

```javascript
// New API structure
{
  action: 'generate_image',
  model_id: modelId,
  prompt: basePrompt,
  negative_prompt: styleNegativePrompt, // NEW
  style: 'professional|doctor|boudoir', // NEW  
  gender: 'man|woman', // NEW (for boudoir only)
  num_images: 4
}
```

#### **Style Configuration:**

```javascript
const styleConfigs = {
  professional: {
    prompt: "professional, corporate headshot, full face frontal only",
    negativePrompt: "no side profiles"
  },
  doctor: {
    prompt: "doctor headshot, full face frontal only", 
    negativePrompt: "no side profiles"
  },
  boudoir: {
    man: {
      prompt: "boudoir, mid body shot, shirtless if man",
      negativePrompt: "no side profiles"
    },
    woman: {
      prompt: "boudoir, mid body shot, subtle, sexy lingerie, if woman detected",
      negativePrompt: "no side profiles"
    }
  }
}
```

### **SUCCESS CRITERIA**

- [ ] Users can select from 3 distinct photo generation styles
- [ ] All styles generate appropriate images with correct prompts
- [ ] No side profile images are generated (negative prompt working)
- [ ] Boudoir style properly detects and applies gender-appropriate styling
- [ ] UI is intuitive and responsive across devices
- [ ] Gemini 2.5 Flash - Nano Banana is successfully integrated

### **INTEGRATION WITH EXISTING PROJECT TASKS**

**Recommended Placement in project-tasks.mdc:**
- Insert after "NEXT IMMEDIATE STEPS" 
- Before "GALLERY & IMAGE LIFECYCLE MANAGEMENT"
- Priority: Phase 0 - Critical enhancement

This feature directly enhances the core value proposition of the photo generation system and should be implemented as a high-priority enhancement to the existing functionality.