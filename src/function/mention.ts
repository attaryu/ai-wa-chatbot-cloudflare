      // Fungsi untuk mention semua member grup
      async function MentionAll(apiEnv: { baseUrl: string; apiKey: string; session: string }, chatId: string) {
        const participants = await getGroupParticipants(apiEnv, chatId);
        const response = await fetch(`${apiEnv.baseUrl}/api/sendText`, {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": apiEnv.apiKey,
          },
          body: JSON.stringify({
            chatId: chatId,
            reply_to: null,
            text: participants.map((id: string) => `@${id.replace("@c.us", "")}`).join(" "),
            session: apiEnv.session,
            mentions: participants,
          }),
        });
        const result = await response.json();
        return result;
      }
