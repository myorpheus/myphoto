# Astria Prompts API Documentation

## 1. Overview of Astria Prompts API

The Astria Prompts API allows you to generate images using your fine-tuned models (tunes). After training a model with your images, you create prompts to generate new images with that trained subject.

**Key Concepts:**
- **Tune**: A fine-tuned model trained on your images
- **Prompt**: A request to generate images using a tune
- **Trigger Word**: Special word (e.g., `ohwx`) that represents the trained subject

**API Endpoint**: `POST /tunes/{tune_id}/prompts`

## 2. Creating Prompts with Fine-Tuned Models

To create a prompt, send a POST request to:
```
https://api.astria.ai/tunes/{tune_id}/prompts
```

Replace `{tune_id}` with your trained model's ID.

**Authentication**: Include API key in Authorization header:
```
Authorization: Bearer YOUR_API_KEY
```

## 3. Parameters with Descriptions and Valid Ranges

### Required Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `text`    | string | Description of the image. **Must include trigger word (e.g., "ohwx man")** |

### Optional Parameters

| Parameter | Type | Range/Values | Description |
|-----------|------|--------------|-------------|
| `negative_prompt` | string | - | Comma-separated list of things to avoid |
| `callback` | string | Valid URL | POST callback when prompt is done |
| `num_images` | integer | 1-8 | Number of images to generate |
| `seed` | integer | 0 to 2^32 | Random seed for consistency |
| `super_resolution` | boolean | true/false | X4 super-resolution |
| `inpaint_faces` | boolean | true/false | Requires super_resolution |
| `hires_fix` | boolean | true/false | Adds details (requires super_resolution) |
| `face_correct` | boolean | true/false | AI face correction |
| `face_swap` | boolean | true/false | Use training images for face swap |
| `cfg_scale` | float | 0-15 | How strictly to follow prompt (higher = stricter) |
| `steps` | integer | 0-50 | Number of diffusion steps |
| `use_lpw` | boolean | true/false | Use weighted prompts |
| `w` | integer | Multiple of 8 | Width in pixels |
| `h` | integer | Multiple of 8 | Height in pixels |
| `scheduler` | string | See below | Diffusion scheduler algorithm |
| `backend_version` | integer | null, 1 | Backend version to use |
| `style` | string | See below | Preset style |
| `color_grading` | string | Film Velvia, Film Portra, Ektar | Color grading preset |
| `film_grain` | boolean | true/false | Adds realistic noise |

**Scheduler Options:**
- `euler`
- `euler_a`
- `dpm++2m_karras`
- `dpm++sde_karras`
- `dpm++2m`
- `dpm++sde`
- `lcm`
- `tcd`

**Style Options:**
- `Cinematic`
- `Animated`
- `Digital Art`
- `Photographic`
- `Fantasy art`
- `Neonpunk`
- `Enhance`
- `Comic book`
- `Lowpoly`
- `Line art`

## 4. Img2Img / ControlNet Options

### ControlNet Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `controlnet` | string | Type: composition, reference, segroom, ipadapter, lineart, canny, depth, mlsd, hed, pose, tile, qr |
| `denoising_strength` | float | 0.0-1.0. 1.0 = use prompt, 0.0 = use image. Default: 0.8 |
| `controlnet_conditioning_scale` | float | 0.0-1.0. Strength of controlnet |
| `controlnet_txt2img` | boolean | True for text-to-image, false for image-to-image |
| `input_image` | binary | Multi-part request with image file |
| `input_image_url` | string | URL to input image |
| `mask_image` | binary | One-channel mask for inpainting |
| `mask_image_url` | string | URL to mask image |
| `lora_scale` | float | Override default LoRA scale (in tune creation) |

## 5. Best Practices for Prompt Creation

### Essential Guidelines

1. **Always Use Trigger Word**: Include `ohwx {gender}` in your prompt (e.g., "ohwx man", "ohwx woman")
2. **Be Specific**: Detailed descriptions yield better results
3. **Use Negative Prompts**: Exclude unwanted elements (e.g., "blurry, distorted, low quality")
4. **Optimal Parameters for Quality**:
   - `cfg_scale`: 7-10 for balanced results
   - `steps`: 25-30 for quality, 15-20 for speed
   - `num_images`: 4 for variety
   - `super_resolution`: true for high-quality output

### Common Patterns

**Professional Headshot:**
```
text: "professional headshot of ohwx man, business attire, clean background, studio lighting"
negative_prompt: "blurry, distorted, low quality, casual"
cfg_scale: 7
steps: 30
```

**Artistic Portrait:**
```
text: "artistic portrait of ohwx woman, oil painting style, dramatic lighting"
negative_prompt: "photograph, realistic, blurry"
style: "Fantasy art"
cfg_scale: 9
```

**Action Scene:**
```
text: "ohwx man in action movie scene, dynamic pose, cinematic lighting"
style: "Cinematic"
cfg_scale: 8
steps: 25
```

## 6. Example Requests and Responses

### Example Request (Node.js)

```javascript
const fetch = require('node-fetch');
const FormData = require('form-data');

const API_URL = 'https://api.astria.ai/tunes/1/prompts';
const API_KEY = 'YOUR_API_KEY';
const headers = { Authorization: `Bearer ${API_KEY}` };

const form = new FormData();
form.append('prompt[text]', 'a painting of ohwx man in the style of Van Gogh');
form.append('prompt[negative_prompt]', 'old, blemish, wrinkles, mole');
form.append('prompt[super_resolution]', true);
form.append('prompt[face_correct]', true);
form.append('prompt[callback]', 'https://your-callback-url.com?prompt_id=1');

fetch(API_URL, {
  method: 'POST',
  headers: headers,
  body: form
}).then(response => response.json())
  .then(data => console.log(data));
```

### Example Response (Create Prompt)

```json
{
  "id": 1,
  "callback": "https://your-callback-url.com?prompt_id=1",
  "text": "a painting of ohwx man in the style of Van Gogh",
  "negative_prompt": "old, blemish, wrinkles, mole",
  "cfg_scale": null,
  "steps": null,
  "seed": null,
  "trained_at": null,
  "started_training_at": null,
  "created_at": "2022-10-06T16:12:54.505Z",
  "updated_at": "2022-10-06T16:12:54.505Z",
  "tune_id": 1,
  "url": "http://api.astria.ai/tunes/1/prompts/1.json"
}
```

### Retrieve a Prompt

```javascript
const headers = { Authorization: `Bearer ${API_KEY}` };
fetch('https://api.astria.ai/tunes/1/prompts/1', { headers: headers })
  .then(response => response.json())
  .then(data => console.log(data));
```

### Example Response (Retrieve Prompt)

```json
{
  "id": 1,
  "callback": "https://optional-callback-url.com/to-your-service-when-ready",
  "text": "a painting of ohwx man in the style of Van Gogh",
  "negative_prompt": "old, blemish, wrinkles, mole",
  "cfg_scale": 7.5,
  "steps": 30,
  "seed": 123456,
  "status": "completed",
  "images": [
    {
      "id": 1,
      "url": "https://astria-generated-image-url.com/image1.jpg"
    }
  ],
  "trained_at": "2022-10-06T16:20:00.000Z",
  "started_training_at": "2022-10-06T16:12:55.000Z",
  "created_at": "2022-10-06T16:12:54.505Z",
  "updated_at": "2022-10-06T16:20:00.505Z",
  "tune_id": 1,
  "url": "http://api.astria.ai/tunes/1/prompts/1.json"
}
```

## 7. Common Issues and Solutions

### Issue 1: "Images must contain at least one image" (422 Error)

**Problem**: Training a tune fails with empty images array

**Solutions**:
- Ensure images are base64 encoded with full data URL prefix: `data:image/jpeg;base64,...`
- Verify image count is between 4-20 images
- Check that images are properly uploaded before training

### Issue 2: Poor Image Quality

**Problem**: Generated images are blurry or low quality

**Solutions**:
- Enable `super_resolution: true`
- Increase `steps` to 30-40
- Use `face_correct: true` for portraits
- Add negative prompts: "blurry, low quality, distorted"

### Issue 3: Subject Not Recognized

**Problem**: Generated images don't include the trained subject

**Solutions**:
- **Always include trigger word** in prompt (e.g., "ohwx man")
- Ensure tune is fully trained (status: "trained")
- Check that tune_id is correct

### Issue 4: Inconsistent Results

**Problem**: Each generation produces vastly different results

**Solutions**:
- Use same `seed` value for consistency
- Increase `cfg_scale` to 10-12 for stricter adherence
- Make prompts more specific and detailed

### Issue 5: Face Issues

**Problem**: Faces are distorted or unrealistic

**Solutions**:
- Enable `face_correct: true`
- Use `face_swap: true` to enhance resemblance to training images
- Enable `inpaint_faces: true` with super_resolution

### Issue 6: Wrong Style/Appearance

**Problem**: Image doesn't match expected style

**Solutions**:
- Use `style` parameter for preset styles
- Add style keywords to prompt (e.g., "photorealistic", "oil painting")
- Use negative prompts to exclude unwanted styles
- Adjust `cfg_scale` (lower for more creative, higher for strict)

## Integration Notes

### For Model Training (Tunes)

When creating a tune, the images parameter format is:
```json
{
  "tune": {
    "title": "Model Title",
    "name": "model name timestamp",
    "callback": "callback_url"
  },
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ],
  "steps": 500,
  "face_crop": true
}
```

### For Image Generation (Prompts)

When creating a prompt, the format is simpler:
```json
{
  "prompt": {
    "text": "ohwx man in professional attire",
    "negative_prompt": "casual, blurry",
    "num_images": 4,
    "super_resolution": true
  }
}
```

## API Limits and Quotas

- Check your Astria dashboard for current API limits
- Rate limiting may apply based on your plan
- Generation time varies based on parameters (typically 30s-2min per image)
- Super-resolution adds significant processing time

## Support and Resources

- **Astria Documentation**: https://docs.astria.ai
- **API Reference**: https://api.astria.ai
- **Support**: Check Astria dashboard for support options
