import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { Client } = require('pg')

    const client = new Client({
      connectionString: 'postgresql://postgres@127.0.0.1:5432/gamerate',
    })

    await client.connect()
    const result = await client.query('SELECT version()')
    await client.end()

    return NextResponse.json({
      success: true,
      version: result.rows[0].version,
      message: 'PostgreSQL connection successful!'
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
