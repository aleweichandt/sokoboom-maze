import { getMessaging, Message, Notification } from 'firebase-admin/messaging';
import getInstance from "./getInstance"

type SupportedLocale =
    | 'de'
    | 'en'
    | 'es'
    | 'fr'
    | 'it'
    | 'ja'
    | 'ko'
    | 'pt'
    | 'ru'
    | 'zh';

type Input = Partial<Record<SupportedLocale, Notification>>;
type Data = Message['data'];

export const broadcastMessage = async (
    topic: string,
    input: Input,
    data?: Data,
): Promise<void> => {
    try {
        const messaging = getMessaging(getInstance())

        const locales: SupportedLocale[] = Object.keys(input) as SupportedLocale[]
        const messages: Message[] = locales.map((locale) => {
            return buildMessage(`${topic}-${locale}`, data, input[locale]!)
        });

        const results = await messaging.sendEach(messages);
    
        if(results.failureCount > 0) {
            const errors = results.responses.filter(it => !!it.error)
            errors.forEach(error => {
                console.error(`('===> Failed to send notification for ${error.messageId}`, error.error)
            })
            throw errors[0];
        }

        console.log('===> Successfully send broadcast message');
    
    } catch (error: any) {
        console.error('===> Error in broadcastMessage:', error);
        throw error;
    }
}

const buildMessage = (
    topic: string,
    data: Data,
    notification: Notification,
): Message => {
    const message: Message = {
        topic,
        data,
        notification,
        android: {
            priority: "high",
            notification: {
                channelId: "DEFAULT",
            },
        },
        apns: {
            payload: {
                aps: {
                    sound: "default",
                    badge: 1,
                },
            },
        },
    }
    return message
}
