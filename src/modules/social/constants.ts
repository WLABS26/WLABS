import type { SocialPlatform, SocialPostType } from "./types";

export const HASHTAG_BANKS: Record<SocialPostType, string[]> = {
  tip: ["#webdesign", "#smb", "#smallbusiness", "#ux", "#websitetips", "#digitalmarketing", "#localbusiness", "#conversion", "#mobiledesign"],
  service_promo: ["#wlabs", "#websiteredesign", "#webdevelopment", "#smallbusiness", "#localbusiness", "#smb", "#websitedesign", "#getfound"],
  industry_spotlight: ["#localbusiness", "#smb", "#digitalmarketing", "#websitedesign", "#businessgrowth", "#onlinemarketing"],
  stat: ["#webdesign", "#smb", "#ux", "#conversion", "#digitalmarketing", "#websitestats", "#businesstips"],
  general_brand: ["#wlabs", "#websitedesign", "#smallbusiness", "#webdev", "#localbusiness", "#smb", "#digitalmarketing"],
};

export type PostTemplates = Record<SocialPlatform, { caption: string; imageDescription: string }>;

export const POST_TEMPLATES: Record<SocialPostType, PostTemplates> = {
  tip: {
    instagram: {
      caption:
        "Quick website tip for local businesses:\n\n✅ Your phone number should be visible on every page — especially the homepage header.\n\nMost visitors decide whether to call you within 10 seconds. Make it effortless.\n\nWe redesign SMB websites that convert. Link in bio →",
      imageDescription:
        "Clean social media graphic: dark navy blue background (#0A1628), bold white sans-serif text '📱 Put your phone number everywhere', accent teal bar (#0EA5E9). WLABS branding bottom-right. Minimal and professional.",
    },
    linkedin: {
      caption:
        "A quick website conversion tip for local businesses:\n\nYour phone number should appear in the header on every single page.\n\nWhy? Most visitors scan for contact info in the first 10 seconds and leave if they can't find it easily.\n\nHere's what we see when we audit local business sites:\n- 68% have contact info buried in the footer only\n- 34% have no clickable phone number on mobile\n- 12% have no contact info on the homepage at all\n\nIf you're running a local business, the easiest thing you can do today is put a click-to-call phone number in your website header.\n\nAt WLABS, we build and redesign SMB websites with conversion as the priority. Drop a comment if you'd like a free site check.",
      imageDescription:
        "Professional LinkedIn banner: dark navy background, white headline 'Website Conversion Tip #1', subtle grid pattern, WLABS wordmark. Clean and corporate.",
    },
  },
  service_promo: {
    instagram: {
      caption:
        "We built WLABS to solve one problem:\n\nLocal businesses deserve websites that actually convert — not expensive agencies, not DIY builders that look like everyone else.\n\n🏗 We redesign your homepage in 48 hours.\n💰 Fixed price. No surprises.\n📱 Mobile-first, conversion-focused.\n\nYour next customer is Googling you right now. Let's make sure they stay.\n\nLink in bio for a free preview of your redesign ↗",
      imageDescription:
        "Bold social media card: split background — dark navy left, bright teal right. Left text: 'Your website in 48 hours. €999 fixed.' Right: simple browser mockup wireframe. WLABS logo top-left.",
    },
    linkedin: {
      caption:
        "We started WLABS because we kept seeing the same problem:\n\nGreat local businesses — dentists, plumbers, electricians, lawyers — running on websites that were costing them customers every day.\n\nNot because they didn't care. Because good web design has always felt expensive, slow, and risky.\n\nSo we built a different model:\n\n→ AI-powered website audit (instant, honest feedback)\n→ A homepage redesign concept delivered in 48 hours\n→ Fixed price at €999 — no agency retainer, no ongoing contract\n\nWe're focused on one market: SMBs in Europe who want a professional online presence without the agency overhead.\n\nIf you run a local business or know someone who does, I'd love to show you what your new homepage could look like. Comment below or reach out directly.",
      imageDescription:
        "Clean LinkedIn post image: white background, dark text '48-hour website redesign for local businesses', WLABS teal accent line, professional typography.",
    },
  },
  industry_spotlight: {
    instagram: {
      caption:
        "Dental clinics: is your website booking appointments or losing them?\n\n🦷 Patients searching for a dentist online make up their mind in under 30 seconds.\n\nThe #1 reason they leave: no clear booking option above the fold.\n\nWe've redesigned dental clinic websites that tripled their online bookings in the first month.\n\nDM us for a free audit of your site.",
      imageDescription:
        "Instagram post graphic: soft teal-to-navy gradient background, tooth icon, headline 'Dental Clinics: Is your website booking patients?', clean sans-serif font, WLABS credit bottom.",
    },
    linkedin: {
      caption:
        "Industry spotlight: Dental clinics\n\nWe've audited dozens of dental practice websites over the past year. Here's what the data shows:\n\n❌ 71% have no online booking option visible above the fold\n❌ 58% have no patient testimonials on the homepage\n❌ 44% load in over 3 seconds on mobile\n✅ But 100% of them have patients actively searching for a new dentist online right now\n\nA patient searching 'dentist near me' on their phone is ready to book. If your website can't capture that intent in 30 seconds, they move to your competitor.\n\nWe specialize in redesigning local business websites — including dental practices. If you manage or own a clinic and want to see what your new homepage could look like, reach out. First audit is always free.",
      imageDescription:
        "LinkedIn industry spotlight banner: white background, teal dental cross icon, text 'Dental Practice Websites: The Data', professional and medical-adjacent aesthetic.",
    },
  },
  stat: {
    instagram: {
      caption:
        "📊 Did you know?\n\n57% of users say they won't recommend a business with a poorly designed mobile website.\n\nYour reputation is showing up in Google before you even get a chance to make a first impression.\n\nMake it count.\n\n— WLABS | Website redesign for local businesses",
      imageDescription:
        "Bold statistics graphic: dark background, large white '57%' number, smaller text 'of users judge a business by its mobile website', teal accent bar, WLABS branding.",
    },
    linkedin: {
      caption:
        "A statistic worth sharing with every local business owner:\n\n📊 57% of consumers say they won't recommend a business if its mobile website is poorly designed.\n\nAnd yet:\n- The average SMB website hasn't been updated in 4+ years\n- 60% of SMB sites fail basic mobile usability tests\n- Local businesses spend €2,000–€5,000/month on ads driving traffic to sites that don't convert\n\nThe bottleneck isn't leads. It's the website.\n\nAt WLABS, we audit and redesign SMB websites for €999 fixed — no agency retainer. The ROI typically covers itself within the first week of better conversion.\n\nAnyone else seeing this pattern with their clients or businesses they work with?",
      imageDescription:
        "Professional stat card: clean white card on light grey background, large bold '57%' in teal, supporting stat text in dark grey, WLABS logo.",
    },
  },
  general_brand: {
    instagram: {
      caption:
        "Why we started WLABS:\n\nThe best plumber in town shouldn't lose customers to a competitor with a nicer website.\n\nGreat local businesses are the backbone of every community. We're here to make sure their online presence matches the quality of their work.\n\n🔧 Website Laboratory\n🌍 Built for European SMBs\n⚡️ 48-hour turnaround",
      imageDescription:
        "Brand story graphic: warm dark background, WLABS logo centered, tagline 'Website Laboratory' below, subtle geometric pattern, teal and navy color scheme.",
    },
    linkedin: {
      caption:
        "Why we built WLABS:\n\nWe kept meeting great local businesses — artisan plumbers, independent physios, family-run restaurants — who were losing customers every day because their websites were outdated, slow, or simply not converting.\n\nThe traditional solution (hire an agency) takes months and costs thousands. DIY builders look generic. Neither option was built for a busy business owner who just needs a professional site that works.\n\nSo we built a third option:\n\n→ AI-driven site audit (honest, specific, instant)\n→ A redesigned homepage concept delivered in 48 hours\n→ Fixed price. No scope creep. No monthly retainer.\n\nWLABS is the website laboratory for European SMBs. We're building the infrastructure to give local businesses the same digital advantage that funded startups take for granted.\n\nIf that mission resonates, follow along — or reach out if you know a local business that needs this.",
      imageDescription:
        "WLABS brand post: dark navy card, WLABS logo in teal, tagline 'Website Laboratory', founding mission statement in small white text below, clean and professional.",
    },
  },
};

export const CONTENT_AGENT_SYSTEM_PROMPT = `You are the WLABS social media content writer. WLABS is a website redesign service for European SMBs (€999 fixed price, 48-hour delivery).

Your job is to rewrite a draft social media caption to be more engaging, authentic, and platform-appropriate.

Instagram rules:
- Hook in the first line (before "more" button)
- Max 2200 characters (aim for 150-300 for most posts)
- Conversational, punchy tone
- 5-10 relevant hashtags at the end
- Emojis welcome but not excessive

LinkedIn rules:
- Professional but human tone, not corporate jargon
- 1000-1500 characters optimal
- Start with a hook or bold claim
- Use line breaks generously (one idea per paragraph)
- 3-5 hashtags at the end
- No emojis on LinkedIn

Always stay on brand: honest, direct, focused on SMB owners and their real problems.

Respond with ONLY a JSON object — no markdown, no preamble:
{ "caption": "...", "hashtags": ["...", "..."], "imageDescription": "..." }`;
