import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NBSE data...');

  // 1. Announcements
  await prisma.announcement.createMany({
    data: [
      {
        message: '📢 NBSE Class 10 Routine 2024 Released! Check out the papers section for past year questions.',
        type: 'BANNER',
        isActive: true,
        priority: 10,
      },
      {
        message: '🚀 New Science and Maths notes uploaded for NBSE Class 10 and 12 students!',
        type: 'SECTION',
        isActive: true,
        priority: 5,
      }
    ]
  });
  console.log('Added Announcements');

  // 2. Subjects
  const subjects = ['Mathematics', 'Science', 'Social Science', 'English', 'Alternative English'];
  const subjectIds = {};
  for (const sub of subjects) {
    const created = await prisma.subject.upsert({
      where: { name: sub },
      update: {},
      create: { name: sub },
    });
    subjectIds[sub] = created.id;
  }
  console.log('Added Subjects');

  // 3. Academic Year
  const year2023 = await prisma.academicYear.upsert({
    where: { year: '2023' },
    update: {},
    create: { year: '2023' },
  });
  console.log('Added Academic Year');

  // 4. Notes
  await prisma.note.createMany({
    data: [
      {
        title: 'NBSE Class 10 Science Ch-1: Chemical Reactions',
        className: '10',
        subjectId: subjectIds['Science'],
        viewUrl: 'https://example.com/notes/view/1',
        downloadFile: 'https://example.com/notes/download/1',
      },
      {
        title: 'NBSE Class 12 Maths: Matrices & Determinants',
        className: '12',
        subjectId: subjectIds['Mathematics'],
        viewUrl: 'https://example.com/notes/view/2',
        downloadFile: 'https://example.com/notes/download/2',
      }
    ]
  });
  console.log('Added Notes');

  // 5. Question Papers
  await prisma.questionPaper.createMany({
    data: [
      {
        title: 'NBSE Class 10 Science Final Paper 2023',
        className: '10',
        subjectId: subjectIds['Science'],
        yearId: year2023.id,
        viewUrl: 'https://example.com/papers/view/1',
        downloadFile: 'https://example.com/papers/download/1',
      },
      {
        title: 'NBSE Class 10 Social Science Board Paper 2023',
        className: '10',
        subjectId: subjectIds['Social Science'],
        yearId: year2023.id,
        viewUrl: 'https://example.com/papers/view/2',
        downloadFile: 'https://example.com/papers/download/2',
      }
    ]
  });
  console.log('Added Question Papers');

  // 6. Videos
  await prisma.video.createMany({
    data: [
      {
        title: 'NBSE Class 10 Maths: Real Numbers Part 1',
        youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Classes',
        subjectId: subjectIds['Mathematics'],
        lectureNumber: 1,
      },
      {
        title: 'NBSE Class 12 Science Strategy & Tips',
        youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Classes',
        subjectId: subjectIds['Science'],
        lectureNumber: 1,
      }
    ]
  });
  console.log('Added Videos');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
