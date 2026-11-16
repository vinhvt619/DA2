export const INTERVIEW_LEVELS = {
  intern: { label: "Thực tập sinh", expectation: "Nền tảng, cách học và ví dụ từ môn học hoặc dự án cá nhân. Không đòi kinh nghiệm đi làm." },
  junior: { label: "Junior", expectation: "Xử lý công việc thông thường có hướng dẫn, giải thích lựa chọn và cách tự kiểm tra." },
  middle: { label: "Middle", expectation: "Xử lý độc lập, so sánh phương án và dự đoán rủi ro khi triển khai." },
  senior: { label: "Senior", expectation: "Ra quyết định khi có ràng buộc, cân nhắc đánh đổi và tác động đến hệ thống hoặc đội ngũ." },
};

export const INTERVIEW_QUESTION_COUNTS = [5, 8, 12];

export const INTERVIEW_FORMATS = {
  general: {
    label: "Sàng lọc",
    description: "Luyện phần đầu của buổi tuyển dụng: kinh nghiệm liên quan, động lực ứng tuyển và mức độ hiểu công việc.",
    example: "Kinh nghiệm nào chuẩn bị cho bạn tốt nhất để đảm nhận vị trí này?",
    questionGuidance: "Hỏi mở về nền tảng, kinh nghiệm liên quan, lý do ứng tuyển hoặc hiểu biết về trách nhiệm của vị trí. Không hỏi câu đố chuyên môn hay yêu cầu kể một sự kiện theo STAR.",
    focus: [
      "Kinh nghiệm liên quan", "Hiểu công việc", "Động lực ứng tuyển", "Thế mạnh phù hợp",
      "Mục tiêu phát triển", "Lý do chọn lĩnh vực", "Trách nhiệm mong muốn", "Kỹ năng có thể chuyển đổi",
      "Kỳ vọng về cách làm việc", "Mức độ sẵn sàng đảm nhận vai trò", "Thành tựu liên quan", "Ưu tiên học trong vai trò mới",
    ],
    criteria: [
      { id: "relevance", label: "Liên hệ với vị trí", description: "Liên hệ kinh nghiệm hoặc động lực với trách nhiệm cụ thể của công việc." },
      { id: "evidence", label: "Minh chứng", description: "Nêu ví dụ hoặc lý do cụ thể hỗ trợ điều đã nói." },
      { id: "clarity", label: "Diễn đạt", description: "Trả lời rõ ràng, trực tiếp và đúng trọng tâm." },
    ],
  },
  technical: {
    label: "Chuyên môn",
    description: "Luyện cách xử lý vấn đề thực tế của vị trí. Giải thích phương án, lý do chọn và cách kiểm tra.",
    example: "Trang danh sách tải chậm khi có nhiều dữ liệu. Bạn sẽ tìm nguyên nhân và kiểm tra cách xử lý ra sao?",
    questionGuidance: "Đặt một tình huống nghiệp vụ hoặc kỹ thuật cụ thể thuộc vị trí, có mục tiêu và dữ kiện đủ để lập luận. Không mặc định vị trí nào cũng làm phần mềm. Không yêu cầu viết mã hoặc có một đáp án duy nhất.",
    focus: [
      "Kiến thức nền", "Chẩn đoán vấn đề", "Lựa chọn phương án", "Kiểm chứng kết quả",
      "Rủi ro và đánh đổi", "Làm rõ yêu cầu", "Xử lý ngoại lệ", "Ưu tiên khi thiếu nguồn lực",
      "Giám sát sau triển khai", "Phục hồi khi có sự cố", "Bàn giao công việc", "Cải tiến quy trình",
    ],
    criteria: [
      { id: "accuracy", label: "Độ đúng chuyên môn", description: "Kiến thức và giải pháp phù hợp với dữ kiện, công việc và cấp độ." },
      { id: "reasoning", label: "Lập luận", description: "Nêu cách xử lý, lý do chọn và cân nhắc các phương án khi phù hợp." },
      { id: "verification", label: "Kiểm chứng", description: "Nêu cách đo kết quả, phát hiện lỗi hoặc kiểm soát rủi ro." },
    ],
  },
  behavioral: {
    label: "Hành vi",
    description: "Kể một tình huống đã trải qua theo STAR: bối cảnh, nhiệm vụ, hành động của chính bạn và kết quả. Có thể lấy ví dụ từ học tập hoặc dự án.",
    example: "Hãy kể về một lần bạn bất đồng với đồng đội. Bạn đã làm gì và kết quả thế nào?",
    questionGuidance: "Hỏi về một sự kiện có thật, liên quan đến năng lực được chỉ định. Gợi người dùng trình bày bối cảnh, nhiệm vụ, hành động cá nhân và kết quả (STAR). Chấp nhận ví dụ học tập, dự án hoặc tình nguyện. Không biến câu hỏi thành tình huống giả định.",
    focus: [
      "Hợp tác", "Xử lý bất đồng", "Chịu trách nhiệm", "Thích nghi với thay đổi",
      "Tiếp nhận phản hồi", "Chủ động học hỏi", "Sắp xếp ưu tiên", "Giao tiếp khi gặp trở ngại",
      "Hỗ trợ đồng đội", "Khắc phục sai sót", "Giữ cam kết", "Thuyết phục bằng dẫn chứng",
    ],
    criteria: [
      { id: "context", label: "Bối cảnh và nhiệm vụ", description: "Nêu rõ sự kiện, trách nhiệm cá nhân và vấn đề cần giải quyết." },
      { id: "action", label: "Hành động cá nhân", description: "Mô tả việc bản thân đã làm và vì sao." },
      { id: "outcome", label: "Kết quả và bài học", description: "Nêu kết quả quan sát được hoặc bài học rút ra, không bắt buộc phải có số liệu." },
    ],
  },
  mixed: {
    label: "Kết hợp",
    description: "Mô phỏng một buổi phỏng vấn có ba phần theo thứ tự: sàng lọc, chuyên môn và hành vi.",
  },
};

export const INTERVIEW_RATING_SCALE = [
  { value: 0, label: "Không có minh chứng" },
  { value: 1, label: "Có đề cập, còn mơ hồ" },
  { value: 2, label: "Có ý phù hợp, còn thiếu" },
  { value: 3, label: "Đáp ứng, có giải thích" },
  { value: 4, label: "Đáp ứng rõ, có minh chứng hoặc cách kiểm chứng phù hợp" },
];

const MIXED_KINDS = ["general", "technical", "behavioral"];
const MIXED_COUNTS = { 5: [1, 2, 2], 8: [2, 3, 3], 12: [2, 5, 5] };

export function getInterviewPlan(type, totalQuestions) {
  const counts = type === "mixed"
    ? MIXED_COUNTS[totalQuestions].map((count, index) => [MIXED_KINDS[index], count])
    : [[type, totalQuestions]];
  return counts.flatMap(([kind, count]) => {
    const { focus } = INTERVIEW_FORMATS[kind];
    return focus.slice(0, count).map((topic) => ({ kind, focus: topic }));
  });
}

export function summarizeInterviewScores(reviews) {
  if (!reviews.length) return null;
  const average = (entries) => Math.round(entries.reduce((sum, review) => sum + review.score, 0) / entries.length);
  const groups = new Map();
  for (const review of reviews) {
    if (!groups.has(review.kind)) groups.set(review.kind, []);
    groups.get(review.kind).push(review);
  }
  const byKind = Array.from(groups, ([kind, entries]) => ({
    kind,
    count: entries.length,
    score: average(entries),
  }));
  return { overallScore: average(reviews), byKind };
}
