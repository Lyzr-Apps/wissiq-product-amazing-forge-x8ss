import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ALLOWED_FILES: Record<string, { contentType: string; filename: string }> = {
  'wissiq_financial_data.csv': {
    contentType: 'application/octet-stream',
    filename: 'wissiq_financial_data.csv',
  },
  'wissiq_company_overview.txt': {
    contentType: 'application/octet-stream',
    filename: 'wissiq_company_overview.txt',
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('file')

  if (!filename || !ALLOWED_FILES[filename]) {
    // Return a list of available files if no file specified
    return NextResponse.json({
      error: !filename ? 'Missing file parameter' : 'File not found',
      available_files: Object.keys(ALLOWED_FILES),
      usage: '/api/sample-data?file=wissiq_financial_data.csv',
    }, { status: filename ? 404 : 400 })
  }

  const fileInfo = ALLOWED_FILES[filename]
  const filePath = path.join(process.cwd(), 'public', 'sample-data', filename)

  try {
    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileInfo.contentType,
        'Content-Disposition': `attachment; filename="${fileInfo.filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
}
