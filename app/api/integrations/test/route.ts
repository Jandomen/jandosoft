import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
  testTelegram,
  testDiscord,
  testSlack,
  testTwilio,
  testWhatsApp,
  testWhatsAppBusiness,
  testInstagram,
  testFacebook,
  testTwitter,
  testThreads,
  testYouTube,
  testGmail,
  testMessenger,
  testTikTok,
  testGoogleMaps,
  testMapbox,
} from "@/lib/services/integrations";

export const POST = withAuth(async (req: NextRequest, auth, body) => {
  const { platform, credentials } = body;
  if (!platform || !credentials) {
    return NextResponse.json({ error: "platform and credentials required" }, { status: 400 });
  }

  let result: { success: boolean; error?: string };

  switch (platform) {
    case "telegram":
      result = await testTelegram(credentials.botToken, credentials.chatId);
      break;
    case "discord":
      result = await testDiscord(credentials.webhookUrl);
      break;
    case "slack":
      result = await testSlack(credentials.webhookUrl);
      break;
    case "twilio":
      result = await testTwilio(credentials.accountSid, credentials.authToken, credentials.phoneNumber, credentials.testNumber || credentials.phoneNumber);
      break;
    case "whatsapp":
      result = await testWhatsApp(credentials.accountSid, credentials.authToken, credentials.phoneNumber, credentials.testNumber || credentials.phoneNumber);
      break;
    case "whatsapp_business":
      result = await testWhatsAppBusiness(credentials.phoneNumberId, credentials.accessToken);
      break;
    case "instagram":
      result = await testInstagram(credentials.instagramBusinessId, credentials.accessToken);
      break;
    case "facebook":
      result = await testFacebook(credentials.pageId, credentials.accessToken);
      break;
    case "twitter":
      result = await testTwitter(credentials.bearerToken);
      break;
    case "threads":
      result = await testThreads(credentials.threadsUserId, credentials.accessToken);
      break;
    case "youtube":
      result = await testYouTube(credentials.apiKey, credentials.channelId);
      break;
    case "gmail":
      result = await testGmail(credentials.accessToken);
      break;
    case "messenger":
      result = await testMessenger(credentials.pageId, credentials.accessToken);
      break;
    case "google_maps":
      result = await testGoogleMaps(credentials.apiKey);
      break;
    case "mapbox":
      result = await testMapbox(credentials.accessToken);
      break;
    case "tiktok":
      result = await testTikTok(credentials.accessToken, credentials.openId);
      break;
    default:
      return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
  }

  return NextResponse.json(result);
});
