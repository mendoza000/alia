import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

export const auth = betterAuth({
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            await sendPasswordResetEmail(user.email, user.name, url);
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendVerificationEmail(user.email, user.name, url);
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "patient",
                input: false,
            },
        },
    },
    plugins: [
        admin({
            defaultRole: "patient",
        }),
        nextCookies(), // must be last
    ],
});

export type Session = typeof auth.$Infer.Session;
