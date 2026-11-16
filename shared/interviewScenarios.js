import { getInterviewPlan, INTERVIEW_FORMATS } from "./interviewPractice.js";

export const PRACTICE_PRESETS = {
  frontend: { role: "Frontend Developer", competencies: ["React và quản lý trạng thái giao diện", "Tích hợp API", "Kiểm thử luồng người dùng"] },
  backend: { role: "Backend Developer", competencies: ["Thiết kế API", "Tính nhất quán dữ liệu", "Kiểm thử và theo dõi lỗi"] },
  support: { role: "Chăm sóc khách hàng", competencies: ["Xử lý khiếu nại", "Tra cứu và xác minh thông tin đơn hàng", "Cập nhật và bàn giao yêu cầu"] },
};

export const PRACTICE_MODES = {
  guided: { label: "Luyện có hướng dẫn", description: "Xem điểm và gợi ý ngay sau mỗi câu được đánh giá." },
  simulation: { label: "Mô phỏng", description: "Nhận câu hỏi và câu hỏi bổ sung trong buổi. Xem điểm và gợi ý khi kết thúc." },
};

const TASKS = {
  frontend: [
    { matches: /react|giao dien|trang thai|state|hieu nang/, prompt: "Trang danh sách tải chậm khi người dùng đổi bộ lọc liên tiếp. API trả kết quả theo nhiều thời điểm khác nhau." },
    { matches: /api|http|tich hop/, prompt: "Người dùng bấm lưu, nhưng API đôi khi trả lỗi sau vài giây. Giao diện vẫn phải hiển thị đúng dữ liệu đã lưu." },
    { matches: /kiem thu|test|mobile|bieu mau/, prompt: "Một biểu mẫu chạy đúng trên máy tính nhưng người dùng điện thoại không hoàn tất được ở bước xác nhận." },
  ],
  backend: [
    { matches: /du lieu|database|sql|nhat quan/, prompt: "Hai yêu cầu tạo cùng một bản ghi đến gần như đồng thời. API phải tránh lưu trùng." },
    { matches: /api|http|phan trang|hieu nang/, prompt: "Một API danh sách tăng thời gian phản hồi khi số bản ghi tăng, trong khi khách hàng vẫn cần lọc và phân trang." },
    { matches: /kiem thu|test|theo doi|giam sat|loi/, prompt: "Một thao tác ghi dữ liệu thành công nhưng bước gửi thông báo thất bại. Người dùng có thể gửi lại yêu cầu." },
  ],
  support: [
    { matches: /giao tre|khieu nai|phan nan/, prompt: "Khách báo đơn giao trễ. Hệ thống xác nhận đơn chưa giao, nhưng chưa có ngày giao mới." },
    { matches: /tra cuu|xac minh|thanh toan/, prompt: "Khách báo đã thanh toán, trong khi hệ thống vẫn hiển thị chờ thanh toán. Bạn có mã đơn hàng để tra cứu." },
    { matches: /cap nhat|ban giao/, prompt: "Ca của bạn sắp kết thúc, khiếu nại chưa được giải quyết và khách đang chờ cập nhật." },
  ],
};

const SCREENING = [
  "Kinh nghiệm nào chuẩn bị cho bạn tốt nhất để làm phần việc này? Nêu một ví dụ cụ thể.",
  "Bạn hiểu kết quả mong đợi của phần việc này là gì?",
  "Vì sao bạn muốn đảm nhận phần việc này trong vị trí đang luyện?",
  "Điểm mạnh nào của bạn có thể dùng ngay cho phần việc này? Hãy nêu căn cứ.",
  "Bạn muốn phát triển kỹ năng nào để làm tốt phần việc này?",
  "Điều gì khiến bạn quan tâm đến lĩnh vực của vị trí này?",
  "Bạn muốn bắt đầu với trách nhiệm nào và vì sao?",
  "Kỹ năng nào từ một lĩnh vực khác có thể áp dụng vào phần việc này?",
  "Cách làm việc nào giúp bạn phát huy tốt nhất khi đảm nhận phần việc này?",
  "Bạn đã chuẩn bị gì để bắt đầu làm phần việc này?",
  "Thành tựu nào cho thấy bạn có thể đóng góp vào phần việc này?",
  "Bạn sẽ ưu tiên học điều gì trong tháng đầu tiên ở vị trí này?",
];

const BEHAVIORAL = [
  "Kể về một lần bạn phải phối hợp với người khác để hoàn thành một việc. Vai trò của bạn và kết quả là gì?",
  "Kể về một lần bạn bất đồng với đồng đội. Bạn trực tiếp làm gì và sau đó điều gì thay đổi?",
  "Kể về một lần bạn chịu trách nhiệm cho một việc gặp trục trặc. Bạn xử lý ra sao?",
  "Kể về một lần yêu cầu thay đổi giữa chừng. Bạn đã điều chỉnh cách làm thế nào?",
  "Kể về một phản hồi khó tiếp nhận. Bạn đã dùng phản hồi đó như thế nào?",
  "Kể về một lần bạn tự học để giải quyết việc chưa biết làm. Bạn đã làm gì và kết quả ra sao?",
  "Kể về một lần có nhiều việc cần hoàn thành cùng lúc. Bạn đã chọn ưu tiên thế nào?",
  "Kể về một lần bạn gặp trở ngại ảnh hưởng đến người khác. Bạn đã thông báo và phối hợp thế nào?",
  "Kể về một lần bạn hỗ trợ một đồng đội đang gặp khó khăn. Bạn đã giúp cụ thể ra sao?",
  "Kể về một sai sót do bạn gây ra. Bạn khắc phục và rút kinh nghiệm thế nào?",
  "Kể về một cam kết có nguy cơ không hoàn thành. Bạn đã xử lý với người liên quan thế nào?",
  "Kể về một lần bạn dùng dẫn chứng để thuyết phục người khác. Kết quả là gì?",
];

const TECHNICAL = [
  "Bạn sẽ bắt đầu xử lý thế nào và dựa vào nguyên tắc nào?",
  "Bạn sẽ kiểm tra dữ kiện nào trước để tìm nguyên nhân?",
  "Bạn cân nhắc những phương án nào và vì sao chọn phương án của mình?",
  "Bạn sẽ kiểm tra bằng cách nào để biết phương án đã đạt mục tiêu?",
  "Rủi ro lớn nhất của phương án là gì và bạn sẽ giảm rủi ro đó thế nào?",
  "Bạn cần làm rõ yêu cầu nào trước khi xử lý?",
  "Bạn sẽ xử lý thế nào nếu dữ kiện đang có chưa đầy đủ?",
  "Nếu nguồn lực có hạn, việc nào cần ưu tiên trước và vì sao?",
  "Sau khi thực hiện, bạn sẽ theo dõi dấu hiệu nào?",
  "Nếu cách xử lý ban đầu không hiệu quả, bạn sẽ đổi hướng thế nào?",
  "Bạn sẽ bàn giao thông tin gì để đồng đội có thể tiếp tục?",
  "Bạn đề xuất cải tiến quy trình nào để tình huống ít lặp lại?",
];

const LEVEL_PROMPTS = {
  intern: "Nêu một bước đầu và một cách tự kiểm tra.",
  junior: "Nêu cách xử lý và lý do chọn.",
  middle: "Nêu giả định và so sánh hai cách xử lý phù hợp.",
  senior: "Giải thích đánh đổi, rủi ro và cách theo dõi sau khi áp dụng.",
};

const ANCHORS = {
  relevance: ["Không liên hệ với vị trí", "Nêu tên vị trí nhưng chưa liên hệ", "Liên hệ được một yêu cầu", "Giải thích liên hệ với nhiệm vụ cụ thể", "Kết nối nhiệm vụ, đóng góp cá nhân và kết quả mong đợi"],
  evidence: ["Không có ví dụ", "Chỉ có khẳng định", "Ví dụ có chi tiết nhưng thiếu vai trò", "Ví dụ nêu rõ việc bản thân làm", "Ví dụ làm rõ việc đã làm và kết quả hoặc bài học"],
  clarity: ["Không trả lời câu hỏi", "Khó xác định ý chính", "Có ý chính nhưng lan man", "Rõ ràng và trực tiếp", "Rõ ràng, có cấu trúc, ưu tiên đúng trọng tâm"],
  accuracy: ["Không có phương án phù hợp", "Phương án có lỗi cơ bản", "Có bước hợp lý nhưng thiếu dữ kiện quan trọng", "Phương án khả thi trong bối cảnh", "Phương án đúng và xử lý được ngoại lệ phù hợp cấp độ"],
  reasoning: ["Không giải thích", "Nêu lựa chọn mà không có lý do", "Có lý do nhưng còn chung", "Giải thích dựa vào dữ kiện và giả định", "Lập luận rõ về đánh đổi hoặc lựa chọn khác"],
  verification: ["Không nêu cách kiểm tra", "Chỉ nói sẽ kiểm tra", "Có chỉ số hoặc phép thử nhưng thiếu điều kiện hoặc mốc", "Nêu phép thử, điều kiện và tiêu chí chấp nhận", "Đạt mức 3 và kiểm tra thêm rủi ro hoặc tình huống quan trọng"],
  context: ["Không có sự kiện", "Kể chung chung", "Có sự kiện nhưng chưa rõ trách nhiệm", "Có bối cảnh, nhiệm vụ và trách nhiệm cụ thể", "Nêu rõ ràng buộc và vì sao tình huống quan trọng"],
  action: ["Không nêu hành động", "Chỉ nêu việc của nhóm", "Có hành động cá nhân nhưng thiếu lý do", "Nêu việc mình làm và lý do", "Nêu hành động, lý do và cách điều chỉnh khi cần"],
  outcome: ["Không nêu kết quả hoặc bài học", "Chỉ khẳng định thành công/thất bại", "Nêu một kết quả hoặc bài học còn chung", "Nêu kết quả quan sát được hoặc bài học cụ thể", "Liên hệ hành động với kết quả và cách áp dụng bài học"],
};

export function createPracticeQuestions(settings, context) {
  const counters = { general: 0, technical: 0, behavioral: 0 };
  const scenarios = TASKS[context.track];
  return getInterviewPlan(settings.type, settings.totalQuestions).map(({ kind, focus }, index) => {
    const offset = counters[kind]++;
    const competency = context.competencies[(kind === "behavioral" ? index : offset) % context.competencies.length];
    const contextLabel = 'Yêu cầu đang luyện: ' + competency.label + '.';
    let prompt;
    if (kind === "technical") {
      const label = competency.label.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLowerCase();
      const scenario = scenarios?.find(({ matches }) => matches.test(label))?.prompt ||
        "Bạn phụ trách phần việc liên quan đến yêu cầu trên. Thông tin ban đầu chưa đầy đủ và bạn cần thống nhất cách xác nhận kết quả với người phụ trách.";
      prompt = [contextLabel, scenario, TECHNICAL[offset], LEVEL_PROMPTS[settings.level]].join(" ");
    } else if (kind === "behavioral") {
      prompt = BEHAVIORAL[offset] + " Bạn có thể dùng ví dụ từ công việc, học tập hoặc dự án.";
    } else {
      prompt = contextLabel + " " + SCREENING[offset];
    }
    return {
      id: "q" + (index + 1), number: index + 1, kind, focus, competency, prompt,
      rubricVersion: 1,
      criteria: INTERVIEW_FORMATS[kind].criteria.map((criterion) => ({ ...criterion, anchors: ANCHORS[criterion.id] })),
    };
  });
}
