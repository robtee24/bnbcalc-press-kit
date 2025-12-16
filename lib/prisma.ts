import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma for Supabase connection pooling (PgBouncer)
// PgBouncer doesn't support prepared statements, so we need to use the direct connection
// or configure Prisma to work with the pooler
const prismaClientOptions: any = {}

// If using connection pooling (port 6543), we need to handle it differently
const databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl.includes(':6543') || databaseUrl.includes('pooler')) {
  // For connection pooling, we'll configure the client to handle it
  // The ?pgbouncer=true parameter should be in the URL itself
  prismaClientOptions.datasources = {
    db: {
      url: databaseUrl.includes('?') ? databaseUrl : `${databaseUrl}?pgbouncer=true&connection_limit=1`,
    },
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

