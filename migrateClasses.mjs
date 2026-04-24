import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');
  
  const defaultClasses = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'CUET', 'JEE', 'NEET'];
  
  console.log('1. Seeding default courses...');
  for (const className of defaultClasses) {
    await prisma.course.upsert({
      where: { name: className },
      update: {},
      create: { name: className }
    });
  }

  console.log('2. Standardizing Videos...');
  // Videos already have "Class 8", so we just need to ensure everything matches
  // Actually, we'll check if any video has "8" instead of "Class 8"
  const videos = await prisma.video.findMany();
  for (const video of videos) {
    let newCat = video.category;
    if (['8', '9', '10', '11', '12'].includes(video.category)) {
      newCat = `Class ${video.category}`;
      await prisma.video.update({
        where: { id: video.id },
        data: { category: newCat }
      });
      console.log(`Updated Video: ${video.id} to ${newCat}`);
    }
  }

  console.log('3. Standardizing Notes...');
  const notes = await prisma.note.findMany();
  for (const note of notes) {
    let newCat = note.className;
    if (['8', '9', '10', '11', '12'].includes(note.className)) {
      newCat = `Class ${note.className}`;
      await prisma.note.update({
        where: { id: note.id },
        data: { className: newCat }
      });
      console.log(`Updated Note: ${note.id} to ${newCat}`);
    }
  }

  console.log('4. Standardizing Question Papers...');
  const papers = await prisma.questionPaper.findMany();
  for (const paper of papers) {
    let newCat = paper.className;
    if (['8', '9', '10', '11', '12'].includes(paper.className)) {
      newCat = `Class ${paper.className}`;
      await prisma.questionPaper.update({
        where: { id: paper.id },
        data: { className: newCat }
      });
      console.log(`Updated Paper: ${paper.id} to ${newCat}`);
    }
  }

  console.log('5. Standardizing Users...');
  const users = await prisma.user.findMany();
  for (const user of users) {
    let newCat = user.class;
    if (newCat && ['8', '9', '10', '11', '12'].includes(newCat)) {
      newCat = `Class ${newCat}`;
      await prisma.user.update({
        where: { id: user.id },
        data: { class: newCat }
      });
      console.log(`Updated User: ${user.id} to ${newCat}`);
    }
  }

  console.log('6. Standardizing Chapters...');
  const chapters = await prisma.chapter.findMany();
  for (const chapter of chapters) {
    let newCat = chapter.className;
    if (['8', '9', '10', '11', '12'].includes(chapter.className)) {
      newCat = `Class ${chapter.className}`;
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { className: newCat }
      });
      console.log(`Updated Chapter: ${chapter.id} to ${newCat}`);
    }
  }

  console.log('Migration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
