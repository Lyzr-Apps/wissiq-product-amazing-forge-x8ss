import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('file')

  if (!filename) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 })
  }

  // Only allow specific sample files (prevent directory traversal)
  const allowedFiles = ['wissiq_financial_data.csv', 'wissiq_company_overview.txt']
  if (!allowedFiles.includes(filename)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'public', 'sample-data', filename)

  try {
    const fileContent = fs.readFileSync(filePath)
    const contentType = filename.endsWith('.csv') ? 'text/csv' : 'text/plain'

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
