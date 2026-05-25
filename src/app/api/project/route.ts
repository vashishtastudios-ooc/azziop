import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';

/**
 * GET /api/project
 * Fetches the user's latest project with all related data (websiteData, brandDNA, campaigns)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user's latest project
    const project = await db.project.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        websiteData: true,
        brandDNA: true,
        campaigns: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'No project found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId: project.id,
        url: project.url,
        status: project.status,
        websiteData: project.websiteData,
        brandDNA: project.brandDNA,
        campaigns: project.campaigns,
      },
    });
  } catch (error) {
    console.error('API Error (Project):', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

