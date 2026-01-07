import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // パスワードのハッシュ化
  const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
  };

  // 既存データのクリーンアップ
  console.log('🧹 Cleaning up existing data...');
  await prisma.comment.deleteMany({});
  await prisma.visitRecord.deleteMany({});
  await prisma.dailyReport.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.employee.deleteMany({});

  // 営業マスタの作成
  console.log('👥 Creating employees...');

  // 管理者
  const admin = await prisma.employee.create({
    data: {
      name: '管理者 太郎',
      email: 'admin@test.com',
      password: await hashPassword('Admin1234!'),
      department: '管理部',
      position: 'システム管理者',
      role: '管理者',
    },
  });

  // 上長
  const manager = await prisma.employee.create({
    data: {
      name: '営業部長 次郎',
      email: 'manager@test.com',
      password: await hashPassword('Test1234!'),
      department: '営業部',
      position: '部長',
      role: '上長',
    },
  });

  // 営業担当者1
  const sales01 = await prisma.employee.create({
    data: {
      name: '営業 一郎',
      email: 'sales@test.com',
      password: await hashPassword('Test1234!'),
      department: '営業部',
      position: '営業',
      role: '営業',
      managerId: manager.id,
    },
  });

  // 営業担当者2
  const sales02 = await prisma.employee.create({
    data: {
      name: '営業 花子',
      email: 'sales02@test.com',
      password: await hashPassword('Test1234!'),
      department: '営業部',
      position: '営業',
      role: '営業',
      managerId: manager.id,
    },
  });

  // 営業担当者3
  const sales03 = await prisma.employee.create({
    data: {
      name: '営業 三郎',
      email: 'sales03@test.com',
      password: await hashPassword('Test1234!'),
      department: '営業部',
      position: '営業',
      role: '営業',
      managerId: manager.id,
    },
  });

  console.log('✅ Created employees:', {
    admin: admin.email,
    manager: manager.email,
    sales01: sales01.email,
    sales02: sales02.email,
    sales03: sales03.email,
  });

  // 顧客マスタの作成
  console.log('🏢 Creating customers...');

  const customers = await Promise.all([
    // sales01担当の顧客
    prisma.customer.create({
      data: {
        customerName: '株式会社テストA',
        address: '東京都千代田区丸の内1-1-1',
        phone: '03-1234-5678',
        email: 'contact@test-a.co.jp',
        assignedEmployeeId: sales01.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: '株式会社テストB',
        address: '東京都港区六本木2-2-2',
        phone: '03-2345-6789',
        email: 'info@test-b.co.jp',
        assignedEmployeeId: sales01.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: '株式会社テストC',
        address: '東京都渋谷区渋谷3-3-3',
        phone: '03-3456-7890',
        email: 'contact@test-c.co.jp',
        assignedEmployeeId: sales01.id,
      },
    }),

    // sales02担当の顧客
    prisma.customer.create({
      data: {
        customerName: '株式会社テストD',
        address: '大阪府大阪市北区梅田4-4-4',
        phone: '06-1234-5678',
        email: 'info@test-d.co.jp',
        assignedEmployeeId: sales02.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: '株式会社テストE',
        address: '大阪府大阪市中央区難波5-5-5',
        phone: '06-2345-6789',
        email: 'contact@test-e.co.jp',
        assignedEmployeeId: sales02.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: '株式会社テストF',
        address: '愛知県名古屋市中区栄6-6-6',
        phone: '052-1234-5678',
        email: 'info@test-f.co.jp',
        assignedEmployeeId: sales02.id,
      },
    }),

    // sales03担当の顧客
    prisma.customer.create({
      data: {
        customerName: '株式会社テストG',
        address: '福岡県福岡市博多区博多7-7-7',
        phone: '092-1234-5678',
        email: 'contact@test-g.co.jp',
        assignedEmployeeId: sales03.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: '株式会社テストH',
        address: '北海道札幌市中央区大通8-8-8',
        phone: '011-1234-5678',
        email: 'info@test-h.co.jp',
        assignedEmployeeId: sales03.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: '株式会社テストI',
        address: '宮城県仙台市青葉区一番町9-9-9',
        phone: '022-1234-5678',
        email: 'contact@test-i.co.jp',
        assignedEmployeeId: sales03.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerName: '株式会社テストJ',
        address: '広島県広島市中区紙屋町10-10-10',
        phone: '082-1234-5678',
        email: 'info@test-j.co.jp',
        assignedEmployeeId: sales03.id,
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // 日報と訪問記録の作成（過去1週間分）
  console.log('📝 Creating daily reports and visit records...');

  const today = new Date();
  const salesEmployees = [
    { employee: sales01, customers: customers.slice(0, 3) },
    { employee: sales02, customers: customers.slice(3, 6) },
    { employee: sales03, customers: customers.slice(6, 10) },
  ];

  let reportCount = 0;
  let visitCount = 0;

  for (const { employee, customers: empCustomers } of salesEmployees) {
    // 過去1週間分の日報を作成（5日分 = 平日想定）
    for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
      // 土日はスキップ
      const reportDate = new Date(today);
      reportDate.setDate(today.getDate() - daysAgo);
      const dayOfWeek = reportDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const report = await prisma.dailyReport.create({
        data: {
          employeeId: employee.id,
          reportDate,
          problem:
            daysAgo === 0
              ? '新規案件の提案資料作成に時間がかかっている。効率的なテンプレートの作成を検討したい。'
              : daysAgo === 1
                ? '顧客からの問い合わせ対応が増えており、優先順位付けに苦慮している。'
                : daysAgo === 2
                  ? '競合他社の価格攻勢が激しく、差別化ポイントの明確化が必要。'
                  : daysAgo === 3
                    ? '新人研修の準備と営業活動の両立が難しい。時間配分の見直しが必要。'
                    : '特になし',
          plan:
            daysAgo === 0
              ? '明日は新規顧客2社への訪問を予定。提案資料の最終確認を行う。'
              : daysAgo === 1
                ? '既存顧客のフォローアップと、新規リードへの初回アプローチを実施予定。'
                : daysAgo === 2
                  ? '競合分析レポートの作成と、価格戦略の見直しミーティングに参加。'
                  : daysAgo === 3
                    ? '新人研修の講師を担当。午後は重要顧客への訪問を実施。'
                    : '週次報告資料の作成と、来週の訪問スケジュール調整。',
        },
      });

      reportCount++;

      // 各日報に1〜3件の訪問記録を追加
      const numVisits = Math.min(
        Math.floor(Math.random() * 3) + 1,
        empCustomers.length,
      );
      const shuffledCustomers = [...empCustomers].sort(
        () => Math.random() - 0.5,
      );

      for (let i = 0; i < numVisits; i++) {
        const visitHour = 9 + Math.floor(Math.random() * 8); // 9:00-16:59
        const visitMinute = Math.floor(Math.random() * 60);
        const visitTimeString = `${visitHour.toString().padStart(2, '0')}:${visitMinute.toString().padStart(2, '0')}:00`;

        await prisma.visitRecord.create({
          data: {
            reportId: report.id,
            customerId: shuffledCustomers[i].id,
            visitContent:
              i === 0
                ? '新商品のデモンストレーションを実施。担当者から高評価をいただき、次回詳細な見積もりを提出することで合意。意思決定者へのプレゼンテーション機会も得られた。'
                : i === 1
                  ? '定期訪問。前回提案した内容について、社内検討の進捗を確認。予算確保の見込みがあり、来月の契約締結に向けて準備を進める。'
                  : '新規アポイント。業界動向や課題のヒアリングを実施。次回、具体的なソリューション提案を行う予定。',
            visitTime: new Date(`1970-01-01T${visitTimeString}Z`),
          },
        });

        visitCount++;
      }
    }
  }

  console.log(
    `✅ Created ${reportCount} daily reports and ${visitCount} visit records`,
  );

  // コメントの作成（上長からのフィードバック）
  console.log('💬 Creating comments...');

  const recentReports = await prisma.dailyReport.findMany({
    take: 10,
    orderBy: { reportDate: 'desc' },
  });

  let commentCount = 0;
  for (const report of recentReports.slice(0, 5)) {
    await prisma.comment.create({
      data: {
        reportId: report.id,
        commenterId: manager.id,
        commentContent:
          commentCount === 0
            ? '本日も精力的に活動されていますね。新規案件の進捗が順調で素晴らしいです。提案資料のテンプレート化については、次回のミーティングで議論しましょう。'
            : commentCount === 1
              ? '顧客対応お疲れ様です。優先順位付けについては、チーム全体で共有できるナレッジがあると良いですね。来週、ベストプラクティスを共有する時間を設けます。'
              : commentCount === 2
                ? '競合分析ありがとうございます。差別化ポイントについては、製品部門とも連携して戦略を練りましょう。来週ミーティングを設定します。'
                : commentCount === 3
                  ? '新人研修お疲れ様です。営業活動との両立は大変ですが、あなたのノウハウは貴重です。時間配分については個別に相談しましょう。'
                  : '今週も良い成果でした。引き続き頑張ってください。',
      },
    });
    commentCount++;
  }

  console.log(`✅ Created ${commentCount} comments`);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  - Employees: 5 (1 admin, 1 manager, 3 sales)`);
  console.log(`  - Customers: ${customers.length}`);
  console.log(`  - Daily Reports: ${reportCount}`);
  console.log(`  - Visit Records: ${visitCount}`);
  console.log(`  - Comments: ${commentCount}`);
  console.log('');
  console.log('🔑 Test Accounts:');
  console.log('  Admin: admin@test.com / Admin1234!');
  console.log('  Manager: manager@test.com / Test1234!');
  console.log('  Sales: sales@test.com / Test1234!');
  console.log('  Sales: sales02@test.com / Test1234!');
  console.log('  Sales: sales03@test.com / Test1234!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
