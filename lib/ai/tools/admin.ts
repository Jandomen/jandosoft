import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_store",
      description: "Create a new store for the user",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Store name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_store",
      description: "Delete a store by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Store name to delete" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_store",
      description: "Update store name, description, industry, location, phone, or coordinates",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Current store name" },
          newName: { type: "string", description: "New store name" },
          description: { type: "string", description: "New description" },
          industry: { type: "string", description: "New industry" },
          location: { type: "string", description: "Store address" },
          phone: { type: "string", description: "Store phone number" },
          coordinates: {
            type: "object",
            properties: {
              lat: { type: "number", description: "Latitude" },
              lng: { type: "number", description: "Longitude" },
            },
            description: "Geographic coordinates",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_telegram_message",
      description: "Send a message via Telegram integration",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message text" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_discord_message",
      description: "Send a message via Discord integration",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message text" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_slack_message",
      description: "Send a message via Slack integration",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message text" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_sms",
      description: "Send an SMS via Twilio integration",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Phone number" },
          message: { type: "string", description: "Message text" },
        },
        required: ["to", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_whatsapp",
      description: "Send a WhatsApp message via Twilio integration",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Phone number" },
          message: { type: "string", description: "Message text" },
        },
        required: ["to", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_whatsapp_business",
      description: "Send a WhatsApp message via Meta Business API",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Phone number" },
          message: { type: "string", description: "Message text" },
        },
        required: ["to", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "post_to_facebook",
      description: "Post a message to Facebook page",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Post text" },
          link: { type: "string", description: "Optional link" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "post_to_instagram",
      description: "Post an image to Instagram",
      parameters: {
        type: "object",
        properties: {
          imageUrl: { type: "string", description: "Image URL" },
          caption: { type: "string", description: "Caption text" },
        },
        required: ["imageUrl", "caption"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "post_to_twitter",
      description: "Post a tweet to Twitter/X",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Tweet text" },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "post_to_threads",
      description: "Create a post on Threads",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Post text" },
          linkUrl: { type: "string", description: "Optional link URL" },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "post_to_tiktok",
      description: "Upload a video to TikTok",
      parameters: {
        type: "object",
        properties: {
          videoUrl: { type: "string", description: "Video URL" },
          description: { type: "string", description: "Video description" },
        },
        required: ["videoUrl", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_youtube_stats",
      description: "Get YouTube channel statistics",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "configure_integration",
      description: "Configure or update a platform integration",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", description: "Platform name (telegram, discord, slack, twilio, whatsapp, whatsapp_business, facebook, instagram, twitter, threads, tiktok, youtube, gmail, messenger)" },
          credentials: { type: "object", description: "Platform credentials/config" },
          enabled: { type: "boolean", description: "Enable immediately" },
        },
        required: ["platform", "credentials"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_integration",
      description: "Enable or disable an integration",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", description: "Platform name" },
          enabled: { type: "boolean", description: "True to enable, false to disable" },
        },
        required: ["platform", "enabled"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_integration",
      description: "Delete an integration configuration",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", description: "Platform name to delete" },
        },
        required: ["platform"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "test_integration",
      description: "Test an integration by sending a test message",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", description: "Platform name to test" },
        },
        required: ["platform"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_integrations",
      description: "List all configured integrations for the store",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_scheduled_tasks",
      description: "List all scheduled tasks",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_scheduled_task",
      description: "Delete a scheduled task by ID",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID to delete" },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_widget_embed",
      description: "Get the embed code for the AI chat widget",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["html", "script"], description: "Embed platform (default html)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_agent_config",
      description: "Get the current AI agent configuration",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "update_agent_config",
      description: "Update the AI agent configuration (colors, welcome message, theme, etc.)",
      parameters: {
        type: "object",
        properties: {
          systemPrompt: { type: "string", description: "Custom system prompt" },
          temperature: { type: "number", description: "AI temperature" },
          model: { type: "string", description: "AI model" },
          logo: { type: "string", description: "Logo URL" },
          primaryColor: { type: "string", description: "Primary color hex" },
          secondaryColor: { type: "string", description: "Secondary color hex" },
          textColor: { type: "string", description: "Text color hex" },
          widgetWelcome: { type: "string", description: "Welcome message" },
          widgetPlaceholder: { type: "string", description: "Input placeholder" },
          widgetHeader: { type: "string", description: "Widget header title" },
          borderColor: { type: "string", description: "Chat border color hex" },
          borderRadius: { type: "number", description: "Border radius in pixels" },
          shadow: { type: "string", description: "Box-shadow CSS value" },
          headerBgColor: { type: "string", description: "Header background color hex" },
          headerTextColor: { type: "string", description: "Header text color hex" },
          botBubbleColor: { type: "string", description: "Bot message bubble background hex" },
          userBubbleColor: { type: "string", description: "User message bubble background hex" },
          chatBgColor: { type: "string", description: "Chat background color hex" },
          inputBgColor: { type: "string", description: "Input field background color hex" },
          inputBorderColor: { type: "string", description: "Input field border color hex" },
          inputFocusColor: { type: "string", description: "Input focus highlight color hex" },
          inputTextColor: { type: "string", description: "Input text color hex" },
          botTextColor: { type: "string", description: "Bot message text color hex" },
          userTextColor: { type: "string", description: "User message text color hex" },
          fontFamily: { type: "string", description: "Chat font family CSS value" },
          buttonSize: { type: "number", description: "Widget button size in pixels (40-80)" },
          buttonPosition: { type: "string", description: "Widget button position: bottom-right, bottom-left" },
          buttonStyle: { type: "string", description: "Widget button style: circle, square, pill" },
          chatWidth: { type: "number", description: "Chat window width in pixels (300-500)" },
          chatHeight: { type: "number", description: "Chat window height in pixels (400-700)" },
          animationType: { type: "string", description: "Chat open animation: slide, fade, scale" },
          inputRadius: { type: "number", description: "Input field border radius in pixels" },
          bubbleRadius: { type: "number", description: "Message bubble border radius in pixels" },
          theme: { type: "string", description: "Theme preset name: custom, default, dark, light, chatgpt, whatsapp, discord, minimal, luxury, ocean, forest, sunset" },
          lang: { type: "string", description: "Widget language code (es, en, pt, fr, de, it)" },
        },
      },
    },
  },
];

export async function executeAdminTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  const { connectDB } = await import("@/lib/mongodb");

  if (["create_store", "delete_store", "update_store"].includes(name)) {
    const { Store } = await import("@/lib/models/Store");
    const { User } = await import("@/lib/models/User");
    await connectDB();

    if (name === "create_store") {
      const user = await User.findById(userId);
      if (!user) return { error: "User not found" };
      const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const store = await Store.create({
        ownerEmail: user.email, name: args.name, slug, type: "general",
        organizationId: user.organizationId, products: [], customers: [],
        orders: [], services: [],
      });
      return { success: true, message: `Empresa "${args.name}" creada con éxito`, storeId: store._id };
    }

    if (name === "delete_store") {
      const user = await User.findById(userId);
      if (!user) return { error: "User not found" };
      const store = await Store.findOneAndDelete({ name: args.name, organizationId: user.organizationId });
      if (!store) return { error: `Empresa "${args.name}" no encontrada` };
      return { success: true, message: `Empresa "${args.name}" eliminada con éxito` };
    }

    if (name === "update_store") {
      const user = await User.findById(userId);
      if (!user) return { error: "User not found" };
      const update: any = {};
      if (args.newName) update.name = args.newName;
      if (args.description) update.desc = args.description;
      if (args.industry) update.industry = args.industry;
      if (args.location !== undefined) update.location = args.location;
      if (args.phone !== undefined) update.phone = args.phone;
      if (args.coordinates !== undefined) update.coordinates = args.coordinates;
      const store = await Store.findOneAndUpdate(
        { name: args.name, organizationId: user.organizationId },
        { $set: update }, { new: true },
      );
      if (!store) return { error: `Empresa "${args.name}" no encontrada` };
      return { success: true, message: `Empresa "${args.name}" actualizada con éxito` };
    }
  }

  if (name === "get_widget_embed") {
    const slug = (store as any)?.slug;
    if (!slug) return { error: "La tienda no tiene slug configurado" };
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://jandosoft.vercel.app";
    const platform = args.platform || "html";
    const script = `<!-- Jandosoft AI Chat Widget -->\n<script src="${origin}/widget.js"></script>\n<script>\n  window.Jandosoft.init({\n    slug: "${slug}",\n    baseUrl: "${origin}"\n  });\n</script>`;
    let embed = script;
    if (platform === "html") {
      embed = `<!-- Jandosoft AI Chat Widget -->\n<iframe src="${origin}/embed/chat/${slug}" width="100%" height="600" frameborder="0"></iframe>\n\n${script}`;
    }
    return { success: true, platform, embed, slug };
  }

  if (name === "get_agent_config") {
    const config = (store as any)?.agentConfig || {};
    return { success: true, agentConfig: config };
  }

  if (name === "update_agent_config") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { Store } = await import("@/lib/models/Store");
    await connectDB();
    const s = await Store.findById(storeId);
    if (!s) return { error: "Store not found" };
    const config = (s as any).agentConfig || {};
    if (args.systemPrompt !== undefined) config.systemPrompt = args.systemPrompt;
    if (args.temperature !== undefined) config.temperature = args.temperature;
    if (args.model !== undefined) config.model = args.model;
    if (args.logo !== undefined) config.logo = args.logo;
    if (args.primaryColor !== undefined) config.primaryColor = args.primaryColor;
    if (args.secondaryColor !== undefined) config.secondaryColor = args.secondaryColor;
    if (args.textColor !== undefined) config.textColor = args.textColor;
    if (args.widgetWelcome !== undefined) config.widgetWelcome = args.widgetWelcome;
    if (args.widgetPlaceholder !== undefined) config.widgetPlaceholder = args.widgetPlaceholder;
    if (args.widgetHeader !== undefined) config.widgetHeader = args.widgetHeader;
    if (args.borderColor !== undefined) config.borderColor = args.borderColor;
    if (args.borderRadius !== undefined) config.borderRadius = args.borderRadius;
    if (args.shadow !== undefined) config.shadow = args.shadow;
    if (args.headerBgColor !== undefined) config.headerBgColor = args.headerBgColor;
    if (args.headerTextColor !== undefined) config.headerTextColor = args.headerTextColor;
    if (args.botBubbleColor !== undefined) config.botBubbleColor = args.botBubbleColor;
    if (args.userBubbleColor !== undefined) config.userBubbleColor = args.userBubbleColor;
    if (args.chatBgColor !== undefined) config.chatBgColor = args.chatBgColor;
    if (args.inputBgColor !== undefined) config.inputBgColor = args.inputBgColor;
    if (args.inputBorderColor !== undefined) config.inputBorderColor = args.inputBorderColor;
    if (args.inputFocusColor !== undefined) config.inputFocusColor = args.inputFocusColor;
    if (args.inputTextColor !== undefined) config.inputTextColor = args.inputTextColor;
    if (args.botTextColor !== undefined) config.botTextColor = args.botTextColor;
    if (args.userTextColor !== undefined) config.userTextColor = args.userTextColor;
    if (args.fontFamily !== undefined) config.fontFamily = args.fontFamily;
    if (args.buttonSize !== undefined) config.buttonSize = args.buttonSize;
    if (args.buttonPosition !== undefined) config.buttonPosition = args.buttonPosition;
    if (args.buttonStyle !== undefined) config.buttonStyle = args.buttonStyle;
    if (args.chatWidth !== undefined) config.chatWidth = args.chatWidth;
    if (args.chatHeight !== undefined) config.chatHeight = args.chatHeight;
    if (args.animationType !== undefined) config.animationType = args.animationType;
    if (args.inputRadius !== undefined) config.inputRadius = args.inputRadius;
    if (args.bubbleRadius !== undefined) config.bubbleRadius = args.bubbleRadius;
    if (args.theme !== undefined) config.theme = args.theme;
    if (args.lang !== undefined) config.lang = args.lang;
    (s as any).agentConfig = config;
    await s.save();
    return { success: true, message: "Configuración del agente actualizada" };
  }

  if (["list_scheduled_tasks", "delete_scheduled_task"].includes(name)) {
    const { ScheduledTask } = await import("@/lib/models/ScheduledTask");
    await connectDB();
    if (name === "list_scheduled_tasks") {
      const storeId = store?._id || store?.id;
      const filter: any = { storeId };
      if (args.status) filter.status = args.status;
      const tasks = await ScheduledTask.find(filter).sort({ runAt: 1 }).limit(50).lean();
      return { success: true, tasks, count: tasks.length };
    }
    if (name === "delete_scheduled_task") {
      const task = await ScheduledTask.findByIdAndDelete(args.taskId).lean();
      if (!task) return { error: `Tarea ${args.taskId} no encontrada` };
      return { success: true, message: `Tarea programada eliminada` };
    }
  }

  const integrationPlatforms = [
    "send_telegram_message", "send_discord_message", "send_slack_message",
    "send_sms", "send_whatsapp", "send_whatsapp_business",
    "post_to_facebook", "post_to_instagram", "post_to_twitter", "post_to_threads",
    "post_to_tiktok", "get_youtube_stats",
    "configure_integration", "toggle_integration", "delete_integration", "test_integration", "list_integrations",
  ];

  if (integrationPlatforms.includes(name)) {
    const storeId = store?._id || store?.id;
    if (!storeId && name !== "list_integrations") return { error: "No store selected" };
    const { Integration } = await import("@/lib/models/Integration");
    await connectDB();

    const PLATFORM_MAP: Record<string, string> = {
      send_telegram_message: "telegram", send_discord_message: "discord",
      send_slack_message: "slack", send_sms: "twilio",
      send_whatsapp: "whatsapp", send_whatsapp_business: "whatsapp_business",
      post_to_facebook: "facebook", post_to_instagram: "instagram",
      post_to_twitter: "twitter", post_to_threads: "threads",
      post_to_tiktok: "tiktok", get_youtube_stats: "youtube",
    };

    if (name.startsWith("send_") || name.startsWith("post_to_") || name === "get_youtube_stats") {
      const platform = PLATFORM_MAP[name];
      const integration = await Integration.findOne({ storeId, platform, enabled: true });
      if (!integration) return { error: `${platform} no está configurado o habilitado.` };
      const integrationService = await import("@/lib/services/integrations");

      const handlers: Record<string, Function> = {
        send_telegram_message: (c: any) => integrationService.sendTelegram(c, args.message),
        send_discord_message: (c: any) => integrationService.sendDiscord(c, args.message),
        send_slack_message: (c: any) => integrationService.sendSlack(c, args.message),
        send_sms: (c: any) => integrationService.sendSMS(c, args.to, args.message),
        send_whatsapp: (c: any) => integrationService.sendWhatsApp(c, args.to, args.message),
        send_whatsapp_business: (c: any) => integrationService.sendWhatsAppBusiness(c, args.to, args.message),
        post_to_facebook: (c: any) => integrationService.postToFacebook(c, args.message, args.link),
        post_to_instagram: (c: any) => integrationService.postToInstagram(c, args.imageUrl, args.caption),
        post_to_twitter: (c: any) => integrationService.postToTwitter(c, args.text),
        post_to_threads: (c: any) => integrationService.postToThreads(c, args.text, args.linkUrl),
        post_to_tiktok: (c: any) => integrationService.postToTikTok(c, args.videoUrl, args.description),
        get_youtube_stats: (c: any) => integrationService.getYouTubeStats(c),
      };

      const handler = handlers[name];
      if (!handler) return { error: `Unknown integration tool: ${name}` };
      const result = await handler(integration.credentials);
      if (!result.success) return { error: `Error: ${result.error}` };

      if (name === "get_youtube_stats") {
        return { success: true, stats: result.stats, message: `YouTube: ${result.stats.title} — ${result.stats.subscribers} suscriptores, ${result.stats.views} vistas, ${result.stats.videos} videos` };
      }
      const labels: Record<string, string> = {
        send_telegram_message: "Telegram", send_discord_message: "Discord",
        send_slack_message: "Slack", send_sms: "SMS", send_whatsapp: "WhatsApp",
        send_whatsapp_business: "WhatsApp Business", post_to_facebook: "Facebook",
        post_to_instagram: "Instagram", post_to_twitter: "Twitter/X",
        post_to_threads: "Threads", post_to_tiktok: "TikTok",
      };
      return { success: true, message: `Mensaje enviado a ${labels[name] || platform}` };
    }

    if (name === "configure_integration") {
      const integration = await Integration.findOneAndUpdate(
        { storeId, platform: args.platform },
        { $set: { storeId, platform: args.platform, credentials: args.credentials, enabled: args.enabled !== false } },
        { upsert: true, new: true },
      ).lean();
      return { success: true, message: `Integración ${args.platform} configurada` };
    }

    if (name === "toggle_integration") {
      const integration = await Integration.findOneAndUpdate(
        { storeId, platform: args.platform },
        { $set: { enabled: args.enabled } }, { new: true },
      ).lean();
      if (!integration) return { error: `Integración ${args.platform} no encontrada` };
      return { success: true, message: `Integración ${args.platform} ${args.enabled ? "activada" : "desactivada"}` };
    }

    if (name === "delete_integration") {
      const integration = await Integration.findOneAndDelete({ storeId, platform: args.platform }).lean();
      if (!integration) return { error: `Integración ${args.platform} no encontrada` };
      return { success: true, message: `Integración ${args.platform} eliminada` };
    }

    if (name === "test_integration") {
      const integration = await Integration.findOne({ storeId, platform: args.platform, enabled: true }).lean();
      if (!integration) return { error: `Integración ${args.platform} no encontrada o no activa` };
      const integrationService = await import("@/lib/services/integrations");
      let result: any;
      if (args.platform === "telegram") result = await integrationService.sendTelegram(integration.credentials, "Test desde Jandosoft ✅");
      else if (args.platform === "discord") result = await integrationService.sendDiscord(integration.credentials, "Test desde Jandosoft ✅");
      else if (args.platform === "slack") result = await integrationService.sendSlack(integration.credentials, "Test desde Jandosoft ✅");
      else if (args.platform === "gmail") result = await integrationService.sendGmail(integration.credentials, integration.credentials.email || "test@test.com", "Test Jandosoft", "Test desde Jandosoft ✅");
      else if (args.platform === "messenger") result = await integrationService.sendMessenger(integration.credentials, integration.credentials.recipientId || "test", "Test desde Jandosoft ✅");
      else result = { success: true, message: "Integración configurada correctamente" };
      if (!result.success) return { error: `Error en prueba: ${result.error}` };
      return { success: true, message: `Integración ${args.platform} funciona correctamente ✅` };
    }

    if (name === "list_integrations") {
      const integrations = await Integration.find({ storeId }).lean();
      return {
        success: true,
        integrations: integrations.map((i: any) => ({
          platform: i.platform, enabled: i.enabled,
          configured: Object.keys(i.credentials || {}).length > 0,
        })),
      };
    }
  }

  return { error: `Unknown admin tool: ${name}` };
}
