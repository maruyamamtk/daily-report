import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // パスワードのハッシュ化
  const hashedPassword = await bcrypt.hash('Test1234!', 10);
  const hashedAdminPassword = await bcrypt.hash('Admin1234!', 10);

  // 営業マスタのシードデータ作成
  const manager = await prisma.employee.create({
    data: {
      name: '山田太郎',
      email: 'manager@test.com',
      department: '営業部',
      position: '営業課長',
      managerId: null,
    },
  });

  const employee1 = await prisma.employee.create({
    data: {
      name: '佐藤花子',
      email: 'sales@test.com',
      department: '営業部',
      position: '営業担当',
      managerId: manager.id,
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      name: '鈴木一郎',
      email: 'suzuki@test.com',
      department: '営業部',
      position: '営業担当',
      managerId: manager.id,
    },
  });

  const admin = await prisma.employee.create({
    data: {
      name: '管理者',
      email: 'admin@test.com',
      department: '管理部',
      position: '管理者',
      managerId: null,
    },
  });

  // ユーザーアカウント作成（NextAuth用）
  await prisma.user.create({
    data: {
      email: 'manager@test.com',
      name: '山田太郎',
      password: hashedPassword,
      role: '上長',
      employeeId: manager.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'sales@test.com',
      name: '佐藤花子',
      password: hashedPassword,
      role: '営業',
      employeeId: employee1.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'suzuki@test.com',
      name: '鈴木一郎',
      password: hashedPassword,
      role: '営業',
      employeeId: employee2.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: '管理者',
      password: hashedAdminPassword,
      role: '管理者',
      employeeId: admin.id,
    },
  });

  // 顧客マスタのシードデータ作成
  const customer1 = await prisma.customer.create({
    data: {
      customerName: '株式会社ABC商事',
      address: '東京都千代田区丸の内1-1-1',
      phone: '03-1234-5678',
      email: 'contact@abc-corp.co.jp',
      assignedEmployeeId: employee1.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerName: '株式会社XYZ産業',
      address: '大阪府大阪市北区梅田2-2-2',
      phone: '06-9876-5432',
      email: 'info@xyz-industry.co.jp',
      assignedEmployeeId: employee1.id,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerName: '有限会社テストサービス',
      address: '神奈川県横浜市西区みなとみらい3-3-3',
      phone: '045-1111-2222',
      email: 'support@test-service.co.jp',
      assignedEmployeeId: employee2.id,
    },
  });

  // 日報のシードデータ作成
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const report1 = await prisma.dailyReport.create({
    data: {
      employeeId: employee1.id,
      reportDate: yesterday,
      problem: '新規顧客の開拓が思うように進んでいません。アプローチ方法について相談したいです。',
      plan: '明日はABC商事様への提案書作成と、新規顧客へのテレアポを予定しています。',
    },
  });

  const report2 = await prisma.dailyReport.create({
    data: {
      employeeId: employee2.id,
      reportDate: yesterday,
      problem: '特になし',
      plan: 'テストサービス様への訪問と、見積書の作成を行います。',
    },
  });

  // 訪問記録のシードデータ作成
  // 訪問時刻を動的に生成（yesterdayをベースに時刻を設定）
  const visit1Time = new Date(yesterday);
  visit1Time.setHours(10, 0, 0, 0);

  const visit2Time = new Date(yesterday);
  visit2Time.setHours(14, 30, 0, 0);

  const visit3Time = new Date(yesterday);
  visit3Time.setHours(11, 0, 0, 0);

  await prisma.visitRecord.create({
    data: {
      reportId: report1.id,
      customerId: customer1.id,
      visitContent: '新製品の提案を行いました。好感触で、来週再度訪問することになりました。',
      visitTime: visit1Time,
    },
  });

  await prisma.visitRecord.create({
    data: {
      reportId: report1.id,
      customerId: customer2.id,
      visitContent: '契約更新の打ち合わせ。価格について再検討が必要との回答を得ました。',
      visitTime: visit2Time,
    },
  });

  await prisma.visitRecord.create({
    data: {
      reportId: report2.id,
      customerId: customer3.id,
      visitContent: 'システム導入の進捗確認。順調に進んでおり、来月には稼働予定です。',
      visitTime: visit3Time,
    },
  });

  // コメントのシードデータ作成
  await prisma.comment.create({
    data: {
      reportId: report1.id,
      commenterId: manager.id,
      commentContent: '新規開拓については、既存顧客からの紹介を活用するのも良いでしょう。来週ミーティングで詳しく相談しましょう。',
    },
  });

  await prisma.comment.create({
    data: {
      reportId: report2.id,
      commenterId: manager.id,
      commentContent: 'お疲れ様です。順調に進んでいるようですね。引き続きよろしくお願いします。',
    },
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
