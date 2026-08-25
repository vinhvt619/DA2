const stringArray = {
  type: "array",
  items: { type: "string" },
};

const score = {
  type: "number",
  minimum: 0,
  maximum: 100,
};

export const AI_RESPONSE_SCHEMAS = {
  resume_improve: {
    name: "resume_improvement",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        suggestion: {
          type: "string",
          description:
            "Noi dung tieu su CV hoan chinh bang tieng Viet, san sang dan truc tiep vao CV. Khong duoc viet loi khuyen, huong dan hay nhan xet.",
        },
        changes: {
          type: "array",
          description:
            "Danh sach ngan gon giai thich nhung diem da duoc cai thien trong suggestion.",
          items: { type: "string" },
        },
      },
      required: ["suggestion", "changes"],
    },
  },
  resume_review: {
    name: "resume_review",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        overallScore: score,
        summary: {
          type: "string",
          description: "Nhan xet tong quan ngan gon ve CV bang tieng Viet.",
        },
        categories: {
          type: "object",
          additionalProperties: false,
          properties: {
            content: score,
            clarity: score,
            impact: score,
            completeness: score,
            ats: score,
          },
          required: [
            "content",
            "clarity",
            "impact",
            "completeness",
            "ats",
          ],
        },
        strengths: {
          type: "array",
          description: "Nhung diem CV dang lam tot, cu the va dua tren dau vao.",
          items: { type: "string" },
        },
        improvements: {
          type: "array",
          description:
            "Nhung van de can sua kem cach sua cu the, sap xep theo muc uu tien.",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              section: {
                type: "string",
                enum: [
                  "Tiểu sử",
                  "Kinh nghiệm",
                  "Học vấn",
                  "Kỹ năng",
                  "Dự án",
                  "Chứng chỉ",
                  "Ngoại ngữ",
                  "Giải thưởng",
                  "Thông tin liên hệ",
                  "Bố cục và ATS",
                  "Khác",
                ],
              },
              issue: { type: "string" },
              fix: { type: "string" },
              priority: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
            },
            required: ["section", "issue", "fix", "priority"],
          },
        },
        missingSections: {
          type: "array",
          description:
            "Cac muc quan trong con thieu hoac chua co du thong tin.",
          items: { type: "string" },
        },
      },
      required: [
        "overallScore",
        "summary",
        "categories",
        "strengths",
        "improvements",
        "missingSections",
      ],
    },
  },
  resume_fill: {
    name: "resume_fill",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        targetRole: {
          type: "string",
          description:
            "Vi tri nghe nghiep muc tieu bang tieng Viet hoac ten chuc danh pho bien.",
        },
        bio: {
          type: "string",
          description:
            "Doan tieu su CV hoan chinh bang tieng Viet, dai 60-100 tu, chi dua tren du lieu that trong dau vao.",
        },
        skills: {
          type: "array",
          description:
            "Cac ky nang co the suy ra truc tiep tu vi tri, kinh nghiem, hoc van hoac noi dung CV.",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              performance: {
                type: "string",
                enum: ["Tệ", "Trung bình", "Tạm được", "Tốt", "Xuất sắc"],
              },
            },
            required: ["title", "description", "performance"],
          },
        },
        experiences: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              description: { type: "string" },
            },
            required: [
              "title",
              "company",
              "location",
              "startDate",
              "endDate",
              "description",
            ],
          },
        },
        education: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              major: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              score: { type: "string" },
              description: { type: "string" },
            },
            required: [
              "title",
              "major",
              "company",
              "location",
              "startDate",
              "endDate",
              "score",
              "description",
            ],
          },
        },
        languages: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["title", "description"],
          },
        },
        certificates: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              date: { type: "string" },
              publisher: { type: "string" },
              description: { type: "string" },
            },
            required: ["title", "date", "publisher", "description"],
          },
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              date: { type: "string" },
              link: { type: "string" },
              description: { type: "string" },
            },
            required: [
              "title",
              "company",
              "location",
              "startDate",
              "endDate",
              "date",
              "link",
              "description",
            ],
          },
        },
        awards: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              awarder: { type: "string" },
              date: { type: "string" },
              description: { type: "string" },
            },
            required: ["title", "awarder", "date", "description"],
          },
        },
        hobbies: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
            },
            required: ["title"],
          },
        },
      },
      required: [
        "targetRole",
        "bio",
        "skills",
        "experiences",
        "education",
        "languages",
        "certificates",
        "projects",
        "awards",
        "hobbies",
      ],
    },
  },
  resume_score: {
    name: "resume_job_score",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        overallScore: score,
        categories: {
          type: "object",
          additionalProperties: false,
          properties: {
            skills: score,
            experience: score,
            education: score,
            keywords: score,
          },
          required: ["skills", "experience", "education", "keywords"],
        },
        strengths: stringArray,
        missingSkills: stringArray,
        recommendations: stringArray,
      },
      required: [
        "overallScore",
        "categories",
        "strengths",
        "missingSkills",
        "recommendations",
      ],
    },
  },
  interview_practice: {
    name: "interview_practice_turn",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        message: {
          type: "string",
          description:
            "Loi noi tiep theo cua nha tuyen dung AI bang tieng Viet.",
        },
        questionNumber: {
          type: "integer",
          minimum: 1,
          maximum: 12,
        },
        isComplete: { type: "boolean" },
        feedback: {
          type: "object",
          additionalProperties: false,
          properties: {
            score: score,
            strengths: stringArray,
            improvements: stringArray,
          },
          required: ["score", "strengths", "improvements"],
        },
        finalSummary: {
          type: "object",
          additionalProperties: false,
          properties: {
            overallScore: score,
            strengths: stringArray,
            improvements: stringArray,
            recommendation: { type: "string" },
          },
          required: [
            "overallScore",
            "strengths",
            "improvements",
            "recommendation",
          ],
        },
      },
      required: [
        "message",
        "questionNumber",
        "isComplete",
        "feedback",
        "finalSummary",
      ],
    },
  },
};
