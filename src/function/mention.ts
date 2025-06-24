import { apiKey, session, chatIds, baseUrl } from "../../config/env.ts";

// Function to fetch group participants
export async function getGroupParticipants() {
    const response = await fetch(`${baseUrl}/api/${session}/groups/${chatIds}/participants`, {
        method: "GET",
        headers: {
            "accept": "*/*",
            "X-Api-Key": apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch participants: ${response.statusText}`);
    }

    const participants = await response.json();
    // console.log("Participants:", participants);

    // Extract and return only the 'id' values, converting format
    const participantIds = participants.map((participant: { id: string }) => 
        participant.id.replace("@s.whatsapp.net", "@c.us")
    );
    console.log(participantIds);
    return participantIds;
}

export async function MentionAll() {
    // Fetch participants before sending the message
    const participants = await getGroupParticipants();

    const response = await fetch(`${baseUrl}/api/sendText`, {
        method: "POST",
        headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
            chatId: chatIds[0], // Assuming you want to send to the first chatId
            reply_to: null,
            text: participants.map((id: string) => `@${id.replace("@c.us", "")}`).join(" "),
            session: session,
            mentions: participants, // Changed to an array of strings
        }),
    });

    const result = await response.json();
    console.log("Response:", result);
}
