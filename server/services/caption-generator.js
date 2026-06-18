import axios from 'axios';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-opus-4-1';

const platformPrompts = {
  tiktok: {
    instructions: `Create a TikTok caption that is viral-worthy and engaging. Keep it punchy and under 150 characters.
Make it use trending language. Include 3-5 hashtags (#FYP, #viral, etc).
Format: [CAPTION]
[HASHTAGS on next line]`,
    maxLength: 150
  },
  instagram: {
    instructions: `Create an Instagram caption that tells a compelling story and encourages engagement. Can be 1-2 paragraphs (up to 2200 chars total).
Use call-to-action. Include 10-15 relevant hashtags.
Format: [CAPTION]
[HASHTAGS on next line]`,
    maxLength: 2200
  },
  youtube: {
    instructions: `Create a YouTube Shorts description that optimizes for search and discovery. Include 1-2 sentences.
Add relevant keywords naturally. Include 5-10 hashtags for discoverability.
Format: [CAPTION]
[HASHTAGS on next line]`,
    maxLength: 5000
  },
  pinterest: {
    instructions: `Create a Pinterest pin description (up to 300 chars) that is keyword-rich for search discovery.
Focus on what the content is about and why people should click.
Include 5-8 hashtags.
Format: [CAPTION]
[HASHTAGS on next line]`,
    maxLength: 300
  }
};

export async function generateCaptions(description, platforms) {
  const captions = {};

  for (const platform of platforms) {
    const prompt = platformPrompts[platform];
    if (!prompt) continue;

    try {
      if (!CLAUDE_API_KEY) {
        throw new Error('Claude API key not configured');
      }

      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CLAUDE_MODEL,
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `You are a social media expert. Create a caption for a video being posted to ${platform}.

${prompt.instructions}

Video description/content: "${description || 'A great video content piece'}"

Remember to keep it platform-specific and engaging!`
            }
          ]
        },
        {
          headers: {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          timeout: 10000
        }
      );

      const content = response.data.content[0].text;
      const lines = content.split('\n').filter(l => l.trim());

      let caption = '';
      let hashtags = [];

      // Parse response - caption first, hashtags last
      if (lines.length >= 2) {
        const lastLine = lines[lines.length - 1];
        if (lastLine.includes('#')) {
          caption = lines.slice(0, -1).join('\n').trim();
          hashtags = lastLine
            .split(/\s+/)
            .filter(word => word.startsWith('#'))
            .slice(0, 15);
        } else {
          caption = lines.join('\n').trim();
          hashtags = [];
        }
      } else {
        caption = lines.join('\n').trim();
      }

      // Ensure we have some hashtags
      if (hashtags.length === 0) {
        hashtags = generateDefaultHashtags(platform);
      }

      // Trim caption to platform limits
      if (caption.length > prompt.maxLength) {
        caption = caption.substring(0, prompt.maxLength).trim();
      }

      captions[platform] = {
        caption: caption,
        hashtags: hashtags
      };
    } catch (error) {
      console.error(`Error generating caption for ${platform}:`, error.message);
      captions[platform] = generateMockCaption(description, platform);
    }
  }

  return captions;
}

function generateDefaultHashtags(platform) {
  const defaultHashtags = {
    tiktok: ['#FYP', '#viral', '#trending', '#foryoupage', '#tiktok'],
    instagram: ['#instagood', '#instagram', '#insta', '#picoftheday', '#instadaily', '#follow', '#like', '#photooftheday'],
    youtube: ['#shorts', '#youtube', '#viral', '#trending', '#video'],
    pinterest: ['#pinterest', '#pinit', '#pinterestideas', '#trending']
  };
  return defaultHashtags[platform] || ['#viral', '#trending', '#content'];
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
