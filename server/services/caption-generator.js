import axios from 'axios';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const platformPrompts = {
  tiktok: {
    instructions: 'Create a TikTok caption that is catchy, engaging, and uses trending sounds/vibes. Keep it under 150 characters. Use 3-5 relevant hashtags.',
    maxLength: 150
  },
  instagram: {
    instructions: 'Create an Instagram caption that tells a story and builds engagement. Can be longer (up to 2200 chars). Use 10-15 relevant hashtags.',
    maxLength: 2200
  },
  youtube: {
    instructions: 'Create a YouTube Shorts description that optimizes for discovery. Include SEO keywords naturally. Use 5-10 hashtags.',
    maxLength: 5000
  },
  pinterest: {
    instructions: 'Create a Pinterest description that is keyword-rich for search discovery. Include relevant terms. Use 5-10 hashtags.',
    maxLength: 300
  }
};

export async function generateCaptions(description, platforms) {
  if (!CLAUDE_API_KEY) {
    console.error('Missing CLAUDE_API_KEY');
    return generateMockCaptions(description, platforms);
  }

  const captions = {};

  for (const platform of platforms) {
    const prompt = platformPrompts[platform];
    if (!prompt) continue;

    try {
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: 'claude-opus-4-1',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: `${prompt.instructions}\n\nOriginal video description: "${description}"\n\nProvide the caption and hashtags separated by "---HASHTAGS---" marker.`
            }
          ]
        },
        {
          headers: {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      const content = response.data.content[0].text;
      const [caption, hashtagsStr] = content.split('---HASHTAGS---').map(s => s.trim());
      const hashtags = hashtagsStr
        ? hashtagsStr.split('\n').map(h => h.trim()).filter(h => h.startsWith('#') || h.length > 0)
        : [];

      captions[platform] = {
        caption: caption.substring(0, prompt.maxLength),
        hashtags: hashtags.slice(0, 15)
      };
    } catch (error) {
      console.error(`Error generating caption for ${platform}:`, error.message);
      captions[platform] = generateMockCaption(description, platform);
    }
  }

  return captions;
}

function generateMockCaptions(description, platforms) {
  const captions = {};
  for (const platform of platforms) {
    captions[platform] = generateMockCaption(description, platform);
  }
  return captions;
}

function generateMockCaption(description, platform) {
  const baseCaption = description || 'Check out this amazing content!';
  const mockHashtags = ['#content', '#creator', '#viral', '#trending', '#foryou'];

  const platformVariations = {
    tiktok: {
      caption: `${baseCaption.substring(0, 100)} 🎬 #FYP`,
      hashtags: mockHashtags.slice(0, 5)
    },
    instagram: {
      caption: `${baseCaption} ✨\n\nSwipe for more content like this!`,
      hashtags: mockHashtags
    },
    youtube: {
      caption: `${baseCaption} - Full video on my channel! Subscribe for more content.`,
      hashtags: mockHashtags.slice(0, 8)
    },
    pinterest: {
      caption: baseCaption.substring(0, 300),
      hashtags: mockHashtags.slice(0, 5)
    }
  };

  return platformVariations[platform] || {
    caption: baseCaption,
    hashtags: mockHashtags
  };
}
