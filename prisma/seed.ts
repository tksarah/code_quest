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
  "コーディング基礎ミニ総復習（PHP）",
  "コーディング応用ミニ総復習（Python）",
  "コーディング応用ミニ総復習（PHP）"
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

const seedMissionTitleMigrations = [
  {
    from: "Python: 配列の値を取り出す",
    to: "Python: リストの値を取り出す"
  },
  {
    from: "PHP: 数値型の考え方",
    to: "PHP: 整数型の考え方"
  }
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
  },
  {
    language: "python",
    type: "concept_check",
    title: "Python: 数値型の考え方",
    prompt: "Pythonで計算に使う数値として最も適切な例はどれですか？",
    choices: ["10", '"10"', '"りんご"', "True"],
    correctAnswer: "10",
    explanation: "10 は数値として扱われるため、足し算や比較などの計算に使えます。",
    tags: ["python", "用語", "数値型"]
  },
  {
    language: "python",
    type: "output_prediction",
    title: "Python: ブール値の結果",
    prompt: "最後の result の値はどれですか？",
    codeSnippet: "score = 80\nresult = score >= 70",
    choices: ["True", "False", "80", "70"],
    correctAnswer: "True",
    explanation: "80は70以上なので、比較の結果は True になります。",
    tags: ["python", "真偽値", "比較"]
  },
  {
    language: "python",
    type: "concept_check",
    title: "Python: コメントの役割",
    prompt: "Pythonで # から始まるコメントの説明として正しいものはどれですか？",
    choices: [
      "実行されず、コードの説明を書くために使う",
      "必ず画面に表示される",
      "変数を作るために使う",
      "ループを止めるために使う"
    ],
    correctAnswer: "実行されず、コードの説明を書くために使う",
    explanation: "Pythonでは # 以降はコメントとして扱われ、プログラムとしては実行されません。",
    tags: ["python", "コメント", "用語"]
  },
  {
    language: "python",
    type: "output_prediction",
    title: "Python: リストの値を取り出す",
    prompt: "printで表示される値はどれですか？",
    codeSnippet: 'items = ["red", "blue", "green"]\nprint(items[1])',
    choices: ["red", "blue", "green", "1"],
    correctAnswer: "blue",
    explanation: "Pythonのリストは0番目から数えるため、items[1] は2つ目の blue です。",
    tags: ["python", "リスト"]
  },
  {
    language: "python",
    type: "output_prediction",
    title: "Python: 関数の戻り値",
    prompt: "最後の answer の値はどれですか？",
    codeSnippet: "def double(x):\n    return x * 2\n\nanswer = double(4)",
    choices: ["2", "4", "8", "double"],
    correctAnswer: "8",
    explanation: "double(4) は 4 * 2 を返すため、answer は8になります。",
    tags: ["python", "関数", "戻り値"]
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
  },
  {
    language: "php",
    type: "concept_check",
    title: "PHP: 整数型の考え方",
    prompt: "PHPで整数型の値として書かれているものはどれですか？",
    choices: ["10", '"10"', '"りんご"', "true"],
    correctAnswer: "10",
    explanation:
      '10 は引用符で囲まれていない整数リテラルです。"10" は数値に変換されることがありますが、値そのものの型は文字列です。',
    tags: ["php", "用語", "整数型"]
  },
  {
    language: "php",
    type: "output_prediction",
    title: "PHP: ブール値の結果",
    prompt: "最後の $result の値はどれですか？",
    codeSnippet: "$score = 80;\n$result = $score >= 70;",
    choices: ["true", "false", "80", "70"],
    correctAnswer: "true",
    explanation: "80は70以上なので、比較の結果は true になります。",
    tags: ["php", "真偽値", "比較"]
  },
  {
    language: "php",
    type: "concept_check",
    title: "PHP: コメントの役割",
    prompt: "PHPで // から始まるコメントの説明として正しいものはどれですか？",
    choices: [
      "実行されず、コードの説明を書くために使う",
      "必ず画面に表示される",
      "変数を作るために使う",
      "ループを止めるために使う"
    ],
    correctAnswer: "実行されず、コードの説明を書くために使う",
    explanation: "PHPでは // 以降はコメントとして扱われ、プログラムとしては実行されません。",
    tags: ["php", "コメント", "用語"]
  },
  {
    language: "php",
    type: "output_prediction",
    title: "PHP: 配列の値を取り出す",
    prompt: "echoで表示される値はどれですか？",
    codeSnippet: '$items = ["red", "blue", "green"];\necho $items[1];',
    choices: ["red", "blue", "green", "1"],
    correctAnswer: "blue",
    explanation: "PHPの配列は0番目から数えるため、$items[1] は2つ目の blue です。",
    tags: ["php", "配列", "array"]
  },
  {
    language: "php",
    type: "output_prediction",
    title: "PHP: 関数の戻り値",
    prompt: "最後の $answer の値はどれですか？",
    codeSnippet: "function double($x) {\n    return $x * 2;\n}\n\n$answer = double(4);",
    choices: ["2", "4", "8", "double"],
    correctAnswer: "8",
    explanation: "double(4) は 4 * 2 を返すため、$answer は8になります。",
    tags: ["php", "関数", "戻り値"]
  }
];

const advancedPythonMissions: MissionSeed[] = [
  {
    language: "python",
    type: "loop_logic",
    title: "Python応用: 条件付き合計",
    prompt: "最後の answer の値はどれですか？",
    codeSnippet:
      "scores = [80, 75, 95]\ntotal = 0\n\nfor score in scores:\n    if score >= 80:\n        total = total + score\n\nanswer = total",
    choices: ["80", "175", "255", "3"],
    correctAnswer: "175",
    explanation: "80以上の80と95だけを合計するため、answer は175になります。",
    tags: ["python", "リスト", "条件分岐", "ループ"],
    difficulty: "hard"
  },
  {
    language: "python",
    type: "output_prediction",
    title: "Python応用: 辞書と関数",
    prompt: "最後の answer の値はどれですか？",
    codeSnippet:
      'items = [\n    {"name": "pen", "price": 100, "stock": 3},\n    {"name": "notebook", "price": 200, "stock": 0},\n    {"name": "bag", "price": 200, "stock": 1},\n]\n\ndef stock_total(items):\n    total = 0\n    for item in items:\n        if item["stock"] > 0:\n            total = total + item["price"] * item["stock"]\n    return total\n\nanswer = stock_total(items)',
    choices: ["300", "450", "500", "800"],
    correctAnswer: "500",
    explanation:
      "stockが1以上のpenは100*3、bagは200*1です。合計は500になります。",
    tags: ["python", "辞書", "関数", "ループ"],
    difficulty: "hard"
  },
  {
    language: "python",
    type: "loop_logic",
    title: "Python応用: 文字列とリスト",
    prompt: "最後の count の値はどれですか？",
    codeSnippet:
      'names = ["Alice", "Bob", "Aya", "Ken"]\ncount = 0\n\nfor name in names:\n    if name.startswith("A"):\n        count = count + 1',
    choices: ["1", "2", "3", "Alice"],
    correctAnswer: "2",
    explanation: "AliceとAyaがAで始まるため、count は2になります。",
    tags: ["python", "文字列", "リスト", "ループ"],
    difficulty: "hard"
  },
  {
    language: "python",
    type: "loop_logic",
    title: "Python応用: ループとbreak",
    prompt: "最後の total の値はどれですか？",
    codeSnippet:
      "numbers = [4, 2, 9, 6]\ntotal = 0\n\nfor number in numbers:\n    total = total + number\n    if total >= 10:\n        break",
    choices: ["6", "10", "15", "21"],
    correctAnswer: "15",
    explanation: "4、2、9の順に足して15になった時点でbreakするため、total は15です。",
    tags: ["python", "break", "ループ", "条件分岐"],
    difficulty: "hard"
  },
  {
    language: "python",
    type: "bug_hunt",
    title: "Python応用: 関数のバグ探し",
    prompt: "このコードの問題点はどれですか？",
    codeSnippet:
      "def find_even(numbers):\n    for number in numbers:\n        if number % 2 == 0:\n            result = number\n    return None\n\nanswer = find_even([1, 4, 7])",
    choices: [
      "条件を満たした時点でreturnする必要がある",
      "for文ではリストを使えない",
      "number % 2 は必ずエラーになる",
      "関数には引数を書けない"
    ],
    correctAnswer: "条件を満たした時点でreturnする必要がある",
    explanation:
      "偶数を見つけても戻り値として返していないため、最後にNoneが返されます。見つけた時点でreturn numberとする必要があります。",
    tags: ["python", "関数", "バグ", "return"],
    difficulty: "hard"
  }
];

const advancedPhpMissions: MissionSeed[] = [
  {
    language: "php",
    type: "loop_logic",
    title: "PHP応用: 条件付き合計",
    prompt: "最後の $answer の値はどれですか？",
    codeSnippet:
      "$scores = [80, 75, 95];\n$total = 0;\n\nforeach ($scores as $score) {\n    if ($score >= 80) {\n        $total = $total + $score;\n    }\n}\n\n$answer = $total;",
    choices: ["80", "175", "255", "3"],
    correctAnswer: "175",
    explanation: "80以上の80と95だけを合計するため、$answer は175になります。",
    tags: ["php", "配列", "条件分岐", "foreach"],
    difficulty: "hard"
  },
  {
    language: "php",
    type: "output_prediction",
    title: "PHP応用: 連想配列と関数",
    prompt: "最後の $answer の値はどれですか？",
    codeSnippet:
      '$items = [\n    ["name" => "pen", "price" => 100, "stock" => 3],\n    ["name" => "notebook", "price" => 200, "stock" => 0],\n    ["name" => "bag", "price" => 200, "stock" => 1],\n];\n\nfunction stockTotal($items) {\n    $total = 0;\n    foreach ($items as $item) {\n        if ($item["stock"] > 0) {\n            $total = $total + $item["price"] * $item["stock"];\n        }\n    }\n    return $total;\n}\n\n$answer = stockTotal($items);',
    choices: ["300", "450", "500", "800"],
    correctAnswer: "500",
    explanation:
      "stockが1以上のpenは100*3、bagは200*1です。合計は500になります。",
    tags: ["php", "連想配列", "関数", "foreach"],
    difficulty: "hard"
  },
  {
    language: "php",
    type: "loop_logic",
    title: "PHP応用: 文字列と配列",
    prompt: "最後の $count の値はどれですか？",
    codeSnippet:
      '$names = ["Alice", "Bob", "Aya", "Ken"];\n$count = 0;\n\nforeach ($names as $name) {\n    if (str_starts_with($name, "A")) {\n        $count = $count + 1;\n    }\n}',
    choices: ["1", "2", "3", "Alice"],
    correctAnswer: "2",
    explanation: "AliceとAyaがAで始まるため、$count は2になります。",
    tags: ["php", "文字列", "配列", "foreach"],
    difficulty: "hard"
  },
  {
    language: "php",
    type: "loop_logic",
    title: "PHP応用: foreachとbreak",
    prompt: "最後の $total の値はどれですか？",
    codeSnippet:
      "$numbers = [4, 2, 9, 6];\n$total = 0;\n\nforeach ($numbers as $number) {\n    $total = $total + $number;\n    if ($total >= 10) {\n        break;\n    }\n}",
    choices: ["6", "10", "15", "21"],
    correctAnswer: "15",
    explanation: "4、2、9の順に足して15になった時点でbreakするため、$total は15です。",
    tags: ["php", "break", "foreach", "条件分岐"],
    difficulty: "hard"
  },
  {
    language: "php",
    type: "output_prediction",
    title: "PHP応用: 厳密比較の確認",
    prompt: "最後の $result の値はどれですか？",
    codeSnippet:
      '$value = "10";\n\nif ($value === 10) {\n    $result = "strict";\n} elseif ($value == 10) {\n    $result = "loose";\n} else {\n    $result = "none";\n}',
    choices: ["both", "loose", "strict", "none"],
    correctAnswer: "loose",
    explanation:
      '"10" === 10 は型が違うため偽ですが、"10" == 10 は型変換されて真になります。',
    tags: ["php", "比較", "型", "条件分岐"],
    difficulty: "hard"
  }
];

const allSeedMissions = [
  ...pythonMissions,
  ...phpMissions,
  ...advancedPythonMissions,
  ...advancedPhpMissions
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

async function migrateSeedMissionTitles() {
  for (const migration of seedMissionTitleMigrations) {
    const [fromMission, toMission] = await Promise.all([
      prisma.mission.findUnique({ where: { title: migration.from }, select: { id: true } }),
      prisma.mission.findUnique({ where: { title: migration.to }, select: { id: true } })
    ]);

    if (fromMission && !toMission) {
      await prisma.mission.update({
        where: { id: fromMission.id },
        data: { title: migration.to }
      });
    }
  }
}

async function upsertQuest(title: string, description: string, missionTitles: string[]) {
  const existingQuest = await prisma.quest.findUnique({
    where: { title },
    include: { _count: { select: { sessions: true } } }
  });

  if (existingQuest && existingQuest._count.sessions > 0) {
    await prisma.quest.update({
      where: { id: existingQuest.id },
      data: { description, maxScore: 100, timeBonusMaxScore: 20, timeLimitSeconds: 600 }
    });
    return;
  }

  const quest = existingQuest
    ? await prisma.quest.update({
        where: { id: existingQuest.id },
        data: { description, maxScore: 100, timeBonusMaxScore: 20, timeLimitSeconds: 600 }
      })
    : await prisma.quest.create({
        data: { title, description, maxScore: 100, timeBonusMaxScore: 20, timeLimitSeconds: 600 }
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

  await migrateSeedMissionTitles();
  await cleanupOldSeedData();

  for (const mission of allSeedMissions) {
    await upsertMission(mission);
  }

  await upsertQuest(
    "コーディング基礎ミニ総復習（Python）",
    "Pythonの変数、数値型、真偽値、コメント、リスト、関数、分岐、ループ、バグ探しをまとめて復習します。",
    pythonMissions.map((mission) => mission.title)
  );

  await upsertQuest(
    "コーディング基礎ミニ総復習（PHP）",
    "PHPの変数、整数型、真偽値、コメント、配列、関数、分岐、ループ、バグ探しをまとめて復習します。",
    phpMissions.map((mission) => mission.title)
  );

  await upsertQuest(
    "コーディング応用ミニ総復習（Python）",
    "Pythonのリスト、辞書、関数、条件分岐、ループ、文字列、バグ探しを組み合わせて復習します。",
    advancedPythonMissions.map((mission) => mission.title)
  );

  await upsertQuest(
    "コーディング応用ミニ総復習（PHP）",
    "PHPの配列、連想配列、関数、条件分岐、foreach、型比較、バグ探しを組み合わせて復習します。",
    advancedPhpMissions.map((mission) => mission.title)
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
