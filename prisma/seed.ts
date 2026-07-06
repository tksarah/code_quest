import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type MissionType =
  | "output_prediction"
  | "variable_trace"
  | "branch_logic"
  | "loop_logic"
  | "bug_hunt"
  | "concept_check";
type Difficulty = "easy" | "normal" | "hard";
type MissionLanguage = "python" | "php" | "generic";

type MissionSeed = {
  language: MissionLanguage;
  type: MissionType;
  title: string;
  prompt: string;
  codeSnippet?: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  tags: string[];
  difficulty?: Difficulty;
};

const seedQuestTitles = [
  "変数と代入の確認クエスト",
  "if文とループの確認クエスト",
  "コーディング基礎ミニ総復習",
  "コーディング基礎ミニ総復習（Python）",
  "コーディング基礎ミニ総復習（PHP）"
];

const oldSeedMissionTitles = [
  "変数の上書きと出力",
  "文字列の連結",
  "countの変化",
  "priceの計算",
  "代入の順番",
  "点数による分岐",
  "等しいかどうか",
  "条件の境目",
  "rangeの合計",
  "3回足す",
  "whileの回数",
  "代入と比較の間違い",
  "コロン忘れ",
  "変数とは",
  "条件分岐とは"
];

const pythonMissions: MissionSeed[] = [
  {
    language: "python",
    type: "variable_trace",
    title: "Python: 変数の値を追う",
    prompt: "最後の count の値はどれですか？",
    codeSnippet: "count = 1\ncount = count + 1\ncount = count + 3",
    choices: ["1", "2", "4", "5"],
    correctAnswer: "5",
    explanation: "countは1、2、5の順に変化します。",
    tags: ["python", "変数", "トレース"]
  },
  {
    language: "python",
    type: "variable_trace",
    title: "Python: 代入の順番",
    prompt: "最後の a の値はどれですか？",
    codeSnippet: "a = 2\nb = a + 3\na = b * 2",
    choices: ["2", "5", "7", "10"],
    correctAnswer: "10",
    explanation: "bは5になり、最後にaへ10が代入されます。",
    tags: ["python", "変数", "代入"]
  },
  {
    language: "python",
    type: "branch_logic",
    title: "Python: if文の流れ",
    prompt: "result には何が入りますか？",
    codeSnippet: 'score = 75\n\nif score >= 80:\n    result = "A"\nelse:\n    result = "B"',
    choices: ["A", "B", "75", "何も入らない"],
    correctAnswer: "B",
    explanation: "75は80以上ではないためelse側が実行されます。",
    tags: ["python", "if", "条件分岐"]
  },
  {
    language: "python",
    type: "branch_logic",
    title: "Python: 比較の境目",
    prompt: "rank には何が入りますか？",
    codeSnippet: 'score = 60\n\nif score > 60:\n    rank = "good"\nelse:\n    rank = "normal"',
    choices: ["good", "normal", "60", "エラー"],
    correctAnswer: "normal",
    explanation: "score > 60 は60ちょうどでは偽です。",
    tags: ["python", "if", "比較"]
  },
  {
    language: "python",
    type: "loop_logic",
    title: "Python: rangeの合計",
    prompt: "最後の total はどれですか？",
    codeSnippet: "total = 0\n\nfor i in range(3):\n    total = total + i",
    choices: ["0", "1", "3", "6"],
    correctAnswer: "3",
    explanation: "range(3)は0,1,2です。合計は3になります。",
    tags: ["python", "for", "ループ"]
  },
  {
    language: "python",
    type: "loop_logic",
    title: "Python: whileの回数",
    prompt: "printは何回実行されますか？",
    codeSnippet: "n = 0\n\nwhile n < 3:\n    print(n)\n    n = n + 1",
    choices: ["2回", "3回", "4回", "無限に続く"],
    correctAnswer: "3回",
    explanation: "nが0,1,2のときに実行され、3になったら終了します。",
    tags: ["python", "while", "ループ"]
  },
  {
    language: "python",
    type: "bug_hunt",
    title: "Python: 比較演算子のミス",
    prompt: "このコードの問題点はどれですか？",
    codeSnippet: 'x = 10\nif x = 10:\n    print("OK")',
    choices: [
      "if文では=ではなく==で比較する",
      "printは使えない",
      "xに10を入れてはいけない",
      "インデントは不要"
    ],
    correctAnswer: "if文では=ではなく==で比較する",
    explanation: "条件式で等しいかを調べるときは == を使います。",
    tags: ["python", "バグ", "比較"]
  },
  {
    language: "python",
    type: "bug_hunt",
    title: "Python: コロン忘れ",
    prompt: "このコードの問題点はどれですか？",
    codeSnippet: 'score = 90\nif score >= 80\n    print("OK")',
    choices: [
      "if行の末尾にコロンが必要",
      "scoreは使えない",
      "90は大きすぎる",
      "printの文字列が短すぎる"
    ],
    correctAnswer: "if行の末尾にコロンが必要",
    explanation: "Pythonのif文では条件の行の最後に : が必要です。",
    tags: ["python", "バグ", "if"]
  },
  {
    language: "python",
    type: "concept_check",
    title: "Python: 変数の考え方",
    prompt: "プログラムにおける「変数」の説明として最も適切なものはどれですか？",
    choices: [
      "値を入れておく名前付きの箱のようなもの",
      "必ず画面に表示される文字",
      "一度しか使えない命令",
      "エラーを自動で直す仕組み"
    ],
    correctAnswer: "値を入れておく名前付きの箱のようなもの",
    explanation: "変数は値を保持し、後から参照したり更新したりできます。",
    tags: ["python", "用語", "変数"]
  },
  {
    language: "python",
    type: "concept_check",
    title: "Python: 条件分岐の考え方",
    prompt: "条件分岐の説明として最も近いものはどれですか？",
    choices: [
      "条件によって実行する処理を変えること",
      "同じ処理を必ず100回行うこと",
      "コードをコメントにすること",
      "変数名を短くすること"
    ],
    correctAnswer: "条件によって実行する処理を変えること",
    explanation: "if文などで条件に応じて処理の流れを変えます。",
    tags: ["python", "用語", "if"]
  }
];

const phpMissions: MissionSeed[] = [
  {
    language: "php",
    type: "variable_trace",
    title: "PHP: 変数の値を追う",
    prompt: "最後の $count の値はどれですか？",
    codeSnippet: "$count = 1;\n$count = $count + 1;\n$count = $count + 3;",
    choices: ["1", "2", "4", "5"],
    correctAnswer: "5",
    explanation: "$countは1、2、5の順に変化します。",
    tags: ["php", "変数", "トレース"]
  },
  {
    language: "php",
    type: "variable_trace",
    title: "PHP: 代入の順番",
    prompt: "最後の $a の値はどれですか？",
    codeSnippet: "$a = 2;\n$b = $a + 3;\n$a = $b * 2;",
    choices: ["2", "5", "7", "10"],
    correctAnswer: "10",
    explanation: "$bは5になり、最後に$aへ10が代入されます。",
    tags: ["php", "変数", "代入"]
  },
  {
    language: "php",
    type: "branch_logic",
    title: "PHP: if文の流れ",
    prompt: "$result には何が入りますか？",
    codeSnippet: '$score = 75;\n\nif ($score >= 80) {\n    $result = "A";\n} else {\n    $result = "B";\n}',
    choices: ["A", "B", "75", "何も入らない"],
    correctAnswer: "B",
    explanation: "75は80以上ではないためelse側が実行されます。",
    tags: ["php", "if", "条件分岐"]
  },
  {
    language: "php",
    type: "branch_logic",
    title: "PHP: 比較の境目",
    prompt: "$rank には何が入りますか？",
    codeSnippet: '$score = 60;\n\nif ($score > 60) {\n    $rank = "good";\n} else {\n    $rank = "normal";\n}',
    choices: ["good", "normal", "60", "エラー"],
    correctAnswer: "normal",
    explanation: "$score > 60 は60ちょうどでは偽です。",
    tags: ["php", "if", "比較"]
  },
  {
    language: "php",
    type: "loop_logic",
    title: "PHP: forの合計",
    prompt: "最後の $total はどれですか？",
    codeSnippet: "$total = 0;\n\nfor ($i = 0; $i < 3; $i++) {\n    $total = $total + $i;\n}",
    choices: ["0", "1", "3", "6"],
    correctAnswer: "3",
    explanation: "$iは0,1,2の順に変化します。合計は3になります。",
    tags: ["php", "for", "ループ"]
  },
  {
    language: "php",
    type: "loop_logic",
    title: "PHP: whileの回数",
    prompt: "echoは何回実行されますか？",
    codeSnippet: "$n = 0;\n\nwhile ($n < 3) {\n    echo $n;\n    $n = $n + 1;\n}",
    choices: ["2回", "3回", "4回", "無限に続く"],
    correctAnswer: "3回",
    explanation: "$nが0,1,2のときに実行され、3になったら終了します。",
    tags: ["php", "while", "ループ"]
  },
  {
    language: "php",
    type: "bug_hunt",
    title: "PHP: 比較演算子のミス",
    prompt: "このコードの問題点はどれですか？",
    codeSnippet: '$x = 10;\nif ($x = 10) {\n    echo "OK";\n}',
    choices: [
      "条件式で代入になっており、比較なら==や===を使う",
      "echoは使えない",
      "$xに10を入れてはいけない",
      "波かっこは不要"
    ],
    correctAnswer: "条件式で代入になっており、比較なら==や===を使う",
    explanation: "PHPでは = は代入です。等しいかを調べる場合は == や === を使います。",
    tags: ["php", "バグ", "比較"]
  },
  {
    language: "php",
    type: "bug_hunt",
    title: "PHP: セミコロン忘れ",
    prompt: "このコードの問題点はどれですか？",
    codeSnippet: '$score = 90\nif ($score >= 80) {\n    echo "OK";\n}',
    choices: [
      "$score = 90 の行末にセミコロンが必要",
      "if文に条件は書けない",
      "90は大きすぎる",
      "echoの文字列が短すぎる"
    ],
    correctAnswer: "$score = 90 の行末にセミコロンが必要",
    explanation: "PHPの文の多くは末尾に ; が必要です。",
    tags: ["php", "バグ", "セミコロン"]
  },
  {
    language: "php",
    type: "concept_check",
    title: "PHP: 変数の考え方",
    prompt: "PHPの変数について最も適切な説明はどれですか？",
    choices: [
      "$から始まる名前で値を保持するもの",
      "必ず画面に表示される文字",
      "一度しか使えない命令",
      "エラーを自動で直す仕組み"
    ],
    correctAnswer: "$から始まる名前で値を保持するもの",
    explanation: "PHPの変数名は $ から始まり、値を保持します。",
    tags: ["php", "用語", "変数"]
  },
  {
    language: "php",
    type: "concept_check",
    title: "PHP: 条件分岐の考え方",
    prompt: "条件分岐の説明として最も近いものはどれですか？",
    choices: [
      "条件によって実行する処理を変えること",
      "同じ処理を必ず100回行うこと",
      "コードをコメントにすること",
      "変数名を短くすること"
    ],
    correctAnswer: "条件によって実行する処理を変えること",
    explanation: "if文などで条件に応じて処理の流れを変えます。",
    tags: ["php", "用語", "if"]
  }
];

async function upsertMission(seed: MissionSeed) {
  return prisma.mission.upsert({
    where: { title: seed.title },
    update: {
      language: seed.language,
      type: seed.type,
      prompt: seed.prompt,
      codeSnippet: seed.codeSnippet,
      choicesJson: JSON.stringify(seed.choices),
      correctAnswer: seed.correctAnswer,
      explanation: seed.explanation,
      tagsJson: JSON.stringify(seed.tags),
      difficulty: seed.difficulty ?? "normal"
    },
    create: {
      language: seed.language,
      type: seed.type,
      title: seed.title,
      prompt: seed.prompt,
      codeSnippet: seed.codeSnippet,
      choicesJson: JSON.stringify(seed.choices),
      correctAnswer: seed.correctAnswer,
      explanation: seed.explanation,
      tagsJson: JSON.stringify(seed.tags),
      difficulty: seed.difficulty ?? "normal"
    }
  });
}

async function upsertQuest(title: string, description: string, missionTitles: string[]) {
  const existingQuest = await prisma.quest.findUnique({
    where: { title },
    include: { _count: { select: { sessions: true } } }
  });

  if (existingQuest && existingQuest._count.sessions > 0) {
    await prisma.quest.update({
      where: { id: existingQuest.id },
      data: { description, maxScore: 100, timeLimitSeconds: 600 }
    });
    return;
  }

  const quest = existingQuest
    ? await prisma.quest.update({
        where: { id: existingQuest.id },
        data: { description, maxScore: 100, timeLimitSeconds: 600 }
      })
    : await prisma.quest.create({
        data: { title, description, maxScore: 100, timeLimitSeconds: 600 }
      });

  const selected = await prisma.mission.findMany({
    where: { title: { in: missionTitles } }
  });
  const byTitle = new Map(selected.map((mission) => [mission.title, mission]));

  await prisma.questItem.deleteMany({ where: { questId: quest.id } });
  await prisma.questItem.createMany({
    data: missionTitles
      .map((missionTitle, index) => {
        const mission = byTitle.get(missionTitle);
        if (!mission) return null;
        return {
          questId: quest.id,
          missionId: mission.id,
          order: index + 1
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  });
}

async function cleanupOldSeedData() {
  const seedQuestsWithoutSessions = await prisma.quest.findMany({
    where: {
      title: { in: seedQuestTitles },
      sessions: { none: {} }
    },
    select: { id: true }
  });
  const questIds = seedQuestsWithoutSessions.map((quest) => quest.id);

  if (questIds.length > 0) {
    await prisma.questItem.deleteMany({ where: { questId: { in: questIds } } });
    await prisma.quest.deleteMany({ where: { id: { in: questIds } } });
  }

  await prisma.mission.deleteMany({
    where: {
      title: { in: oldSeedMissionTitles },
      questItems: { none: {} },
      responses: { none: {} }
    }
  });
}

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD ?? "changeme";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: "初期管理者",
      role: "OWNER",
      isActive: true
    },
    create: {
      email: adminEmail,
      name: "初期管理者",
      passwordHash,
      role: "OWNER"
    }
  });

  await cleanupOldSeedData();

  for (const mission of [...pythonMissions, ...phpMissions]) {
    await upsertMission(mission);
  }

  await upsertQuest(
    "コーディング基礎ミニ総復習（Python）",
    "Pythonの変数、分岐、ループ、バグ探しをまとめて復習します。",
    pythonMissions.map((mission) => mission.title)
  );

  await upsertQuest(
    "コーディング基礎ミニ総復習（PHP）",
    "PHPの変数、分岐、ループ、バグ探しをまとめて復習します。",
    phpMissions.map((mission) => mission.title)
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
