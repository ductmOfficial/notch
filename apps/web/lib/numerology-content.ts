import type { Locale } from "./i18n/messages";
import type { ArrowKey, PlaneKey } from "./numerology";

/**
 * What each number and line of the chart is said to mean, for the "just for fun" numerology
 * page. Written to be kind and practical: traits, what to nurture and how parents can help.
 * Nothing about health, and no predictions.
 */

export interface NumberMeaning {
  readonly title: string;
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly nurture: readonly string[];
  readonly parents: readonly string[];
}

/** The numbers a reading can reach: 1–9 and the master numbers. */
export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

export const MEANINGS: Record<Locale, Record<number, NumberMeaning>> = {
  vi: {
    1: {
      title: "Người tiên phong",
      summary: "Độc lập, chủ động, thích tự mình làm và thử trước.",
      strengths: ["Tự tin thử điều mới", "Có chính kiến từ sớm", "Bền bỉ khi đã muốn làm"],
      nurture: ["Biết lắng nghe và chờ đến lượt", "Nhận giúp đỡ khi cần"],
      parents: [
        "Cho bé tự chọn trong vài lựa chọn nhỏ (áo, đồ chơi)",
        "Khen nỗ lực, không chỉ khen kết quả",
      ],
    },
    2: {
      title: "Người kết nối",
      summary: "Nhạy cảm, hoà nhã, thích ở bên và giúp đỡ người khác.",
      strengths: ["Dễ đồng cảm", "Biết chia sẻ, hợp tác", "Tinh ý với cảm xúc của người khác"],
      nurture: ["Nói ra điều mình muốn", "Bình tĩnh khi có thay đổi"],
      parents: [
        "Gọi tên cảm xúc cùng bé (vui, buồn, giận)",
        "Giữ nếp sinh hoạt đều để bé thấy an toàn",
      ],
    },
    3: {
      title: "Người vui vẻ",
      summary: "Giàu tưởng tượng, thích kể chuyện, hát và biểu diễn.",
      strengths: ["Hoạt ngôn, biểu cảm", "Sáng tạo", "Mang lại tiếng cười"],
      nurture: ["Tập trung làm xong một việc", "Kiên nhẫn với việc lặp lại"],
      parents: [
        "Đọc truyện, hát, vẽ cùng bé mỗi ngày",
        "Chia việc thành bước nhỏ, mỗi bước một lời khen",
      ],
    },
    4: {
      title: "Người xây dựng",
      summary: "Chăm chỉ, ngăn nắp, thích những điều quen thuộc và rõ ràng.",
      strengths: ["Kiên trì", "Đáng tin cậy", "Thích sắp xếp, lắp ghép"],
      nurture: ["Linh hoạt khi kế hoạch thay đổi", "Thoải mái với điều chưa quen"],
      parents: [
        "Báo trước khi có thay đổi trong ngày",
        "Chơi xếp hình, lắp ghép, phân loại đồ vật",
      ],
    },
    5: {
      title: "Người khám phá",
      summary: "Tò mò, năng động, thích điều mới và những chuyến đi.",
      strengths: ["Ham học hỏi", "Thích nghi nhanh", "Nhiều năng lượng"],
      nurture: ["Ngồi yên lâu hơn một chút", "Theo hết một việc đã bắt đầu"],
      parents: [
        "Cho bé chơi ngoài trời và thử nhiều hoạt động",
        "Đặt vài giới hạn rõ ràng, giải thích vì sao",
      ],
    },
    6: {
      title: "Người chăm sóc",
      summary: "Ấm áp, biết quan tâm, gắn bó với gia đình.",
      strengths: ["Biết yêu thương, chăm lo", "Có trách nhiệm", "Thích làm người khác vui"],
      nurture: ["Không phải lúc nào cũng phải làm vừa lòng mọi người", "Chăm sóc cả bản thân"],
      parents: ["Để bé phụ việc nhỏ trong nhà và cảm ơn bé", "Dạy bé rằng nói 'không' cũng được"],
    },
    7: {
      title: "Người quan sát",
      summary: "Thích ngắm nhìn, suy nghĩ và đặt câu hỏi “vì sao”.",
      strengths: ["Tò mò sâu", "Biết quan sát chi tiết", "Thích tự tìm hiểu"],
      nurture: ["Chia sẻ suy nghĩ với người khác", "Hoà vào nhóm bạn"],
      parents: [
        "Cho bé thời gian yên tĩnh để chơi một mình",
        "Trả lời câu hỏi 'vì sao' và cùng bé tìm câu trả lời",
      ],
    },
    8: {
      title: "Người quyết tâm",
      summary: "Kiên trì, có tổ chức, thích thử thách và hoàn thành việc.",
      strengths: ["Mạnh mẽ", "Có mục tiêu", "Biết tổ chức"],
      nurture: ["Mềm mỏng khi chơi cùng bạn", "Chấp nhận thua"],
      parents: [
        "Giao việc vừa sức để bé tự hoàn thành",
        "Chơi trò có thắng thua để bé tập bình tĩnh",
      ],
    },
    9: {
      title: "Người bao dung",
      summary: "Rộng lượng, giàu lòng trắc ẩn, dễ đồng cảm.",
      strengths: ["Tốt bụng", "Giàu trí tưởng tượng", "Quan tâm đến mọi người"],
      nurture: ["Giữ ranh giới cho mình", "Buông bỏ khi việc đã qua"],
      parents: ["Cùng bé chia sẻ đồ chơi, giúp người khác", "Đọc truyện về thiên nhiên và con vật"],
    },
    11: {
      title: "Người truyền cảm hứng",
      summary: "Giàu trực giác và cảm xúc, dễ làm người xung quanh vui lên.",
      strengths: ["Trực giác tốt", "Nhạy cảm, tinh tế", "Giàu cảm hứng"],
      nurture: ["Giữ bình tĩnh khi xúc động mạnh", "Ngủ nghỉ, sinh hoạt đều"],
      parents: ["Tạo không gian yên ả cho bé dịu lại", "Lắng nghe khi bé kể điều mình cảm thấy"],
    },
    22: {
      title: "Người kiến tạo",
      summary: "Có hoài bão, thích biến ý tưởng lớn thành việc cụ thể.",
      strengths: ["Nhìn xa", "Thực tế", "Kiên định"],
      nurture: ["Không ôm quá nhiều việc", "Vui với từng bước nhỏ"],
      parents: ["Cùng bé làm dự án nhỏ từ đầu đến cuối", "Ghi nhận cả những bước nhỏ"],
    },
    33: {
      title: "Người yêu thương",
      summary: "Giàu tình cảm, thích che chở và nâng đỡ người khác.",
      strengths: ["Ấm áp", "Biết an ủi", "Sẵn lòng giúp đỡ"],
      nurture: ["Không gánh cảm xúc của người khác", "Vui chơi đúng tuổi"],
      parents: [
        "Nhắc bé rằng bé được yêu thương vô điều kiện",
        "Dành thời gian chỉ để chơi cùng bé",
      ],
    },
  },
  en: {
    1: {
      title: "The pioneer",
      summary: "Independent and eager, likes to do things alone and go first.",
      strengths: [
        "Confident with new things",
        "Has opinions early",
        "Persistent once set on something",
      ],
      nurture: ["Listening and waiting for a turn", "Accepting help when needed"],
      parents: ["Offer small choices (clothes, toys)", "Praise the effort, not only the result"],
    },
    2: {
      title: "The connector",
      summary: "Gentle and sensitive, likes to be with others and help.",
      strengths: ["Empathetic", "Shares and cooperates", "Notices how others feel"],
      nurture: ["Saying what they want", "Staying calm with change"],
      parents: [
        "Name feelings together (happy, sad, angry)",
        "Keep a steady routine so they feel safe",
      ],
    },
    3: {
      title: "The joyful one",
      summary: "Imaginative, loves stories, songs and showing off a little.",
      strengths: ["Expressive", "Creative", "Brings laughter"],
      nurture: ["Finishing one thing", "Patience with repetition"],
      parents: [
        "Read, sing and draw together every day",
        "Break tasks into small steps, praising each",
      ],
    },
    4: {
      title: "The builder",
      summary: "Hard-working and tidy, likes what is familiar and clear.",
      strengths: ["Persistent", "Reliable", "Loves sorting and building"],
      nurture: ["Flexibility when plans change", "Ease with the unfamiliar"],
      parents: [
        "Tell them ahead of changes in the day",
        "Play with blocks, puzzles and sorting games",
      ],
    },
    5: {
      title: "The explorer",
      summary: "Curious and lively, loves new things and outings.",
      strengths: ["Eager to learn", "Adapts quickly", "Full of energy"],
      nurture: ["Sitting still a little longer", "Following through on what they start"],
      parents: ["Play outdoors and try many activities", "Set a few clear limits and explain why"],
    },
    6: {
      title: "The carer",
      summary: "Warm and caring, close to the family.",
      strengths: ["Loving and caring", "Responsible", "Likes to make others happy"],
      nurture: ["Not having to please everyone", "Caring for themselves too"],
      parents: ["Let them help with small chores and thank them", "Teach that saying 'no' is fine"],
    },
    7: {
      title: "The observer",
      summary: "Likes to watch, think and ask “why”.",
      strengths: ["Deeply curious", "Notices details", "Likes to find out alone"],
      nurture: ["Sharing thoughts with others", "Joining in with other children"],
      parents: [
        "Allow quiet time to play alone",
        "Answer the 'why' questions and look things up together",
      ],
    },
    8: {
      title: "The determined one",
      summary: "Persistent and organised, likes a challenge and finishing things.",
      strengths: ["Strong-willed", "Goal-minded", "Organised"],
      nurture: ["Gentleness when playing with others", "Losing gracefully"],
      parents: [
        "Give tasks they can finish alone",
        "Play games with winners and losers to practise calm",
      ],
    },
    9: {
      title: "The generous one",
      summary: "Big-hearted and kind, quick to understand others.",
      strengths: ["Kind", "Imaginative", "Cares about everyone"],
      nurture: ["Keeping their own boundaries", "Letting go of what is past"],
      parents: ["Share toys and help others together", "Read stories about nature and animals"],
    },
    11: {
      title: "The inspirer",
      summary: "Intuitive and full of feeling, lifts the mood around them.",
      strengths: ["Good intuition", "Sensitive and perceptive", "Full of inspiration"],
      nurture: ["Staying calm with strong feelings", "Steady sleep and routine"],
      parents: ["Make a quiet corner to calm down", "Listen when they talk about how they feel"],
    },
    22: {
      title: "The master builder",
      summary: "Ambitious, likes to turn big ideas into real things.",
      strengths: ["Far-sighted", "Practical", "Steady"],
      nurture: ["Not taking on too much", "Enjoying small steps"],
      parents: ["Do a small project together from start to end", "Notice the small steps too"],
    },
    33: {
      title: "The nurturer",
      summary: "Very loving, likes to protect and support others.",
      strengths: ["Warm", "Comforting", "Ready to help"],
      nurture: ["Not carrying others' feelings", "Playing like a child"],
      parents: [
        "Remind them they are loved without conditions",
        "Spend time just playing together",
      ],
    },
  },
};

/** The theme of a personal year. */
export const YEAR_THEMES: Record<Locale, Record<number, string>> = {
  vi: {
    1: "Năm của khởi đầu: nhiều điều mới, bé tự làm được thêm nhiều việc.",
    2: "Năm của gắn kết: hợp với nếp sinh hoạt đều và thời gian bên gia đình.",
    3: "Năm của biểu đạt: lời nói, tiếng hát, trò chơi sáng tạo.",
    4: "Năm của nền nếp: tập thói quen tốt, làm từng bước.",
    5: "Năm của khám phá: đi chơi, thử hoạt động mới, nhiều thay đổi.",
    6: "Năm của yêu thương: gia đình, bạn bè, chăm sóc lẫn nhau.",
    7: "Năm của tìm hiểu: nhiều câu hỏi, thích quan sát và chơi yên tĩnh.",
    8: "Năm của nỗ lực: tự giác hơn, thích hoàn thành việc.",
    9: "Năm của khép lại: hoàn tất một giai đoạn, sẵn sàng cho chặng mới.",
    11: "Năm của cảm hứng: giàu cảm xúc, cần nhiều sự lắng nghe.",
    22: "Năm của xây dựng: hợp với những dự án nhỏ làm cùng nhau.",
    33: "Năm của sẻ chia: quan tâm, giúp đỡ người khác.",
  },
  en: {
    1: "A year of beginnings: many new things, more done on their own.",
    2: "A year of closeness: steady routines and family time suit it.",
    3: "A year of expression: words, songs and creative play.",
    4: "A year of habits: good routines, one step at a time.",
    5: "A year of discovery: outings, new activities, change.",
    6: "A year of love: family, friends, caring for each other.",
    7: "A year of curiosity: many questions, watching and quiet play.",
    8: "A year of effort: more self-driven, keen to finish things.",
    9: "A year of closing: one stage ends, ready for the next.",
    11: "A year of inspiration: full of feeling, needs listening.",
    22: "A year of building: small projects done together suit it.",
    33: "A year of sharing: caring for and helping others.",
  },
};

export interface ArrowMeaning {
  readonly name: string;
  /** When all three digits appear. */
  readonly full: string;
  /** When none of them do: something to encourage, never a flaw. */
  readonly empty: string;
}

export const ARROW_MEANINGS: Record<Locale, Record<ArrowKey, ArrowMeaning>> = {
  vi: {
    plan: {
      name: "Mũi tên Kế hoạch (1-2-3)",
      full: "Thích sắp xếp, làm việc có trình tự.",
      empty: "Có thể cần bố mẹ cùng lên kế hoạch từng bước.",
    },
    will: {
      name: "Mũi tên Ý chí (4-5-6)",
      full: "Kiên trì, đã muốn là làm đến cùng.",
      empty: "Có thể cần khích lệ để theo đuổi việc đã chọn.",
    },
    action: {
      name: "Mũi tên Hành động (7-8-9)",
      full: "Năng động, nghĩ là làm.",
      empty: "Có thể cần được khuyến khích bắt tay vào việc.",
    },
    mind: {
      name: "Mũi tên Trí tuệ (3-6-9)",
      full: "Nhớ tốt, thích suy nghĩ và học hỏi.",
      empty: "Có thể thích học qua trải nghiệm hơn là ghi nhớ.",
    },
    emotion: {
      name: "Mũi tên Cân bằng cảm xúc (2-5-8)",
      full: "Cảm xúc hài hoà, dễ hoà đồng.",
      empty: "Có thể cần được giúp gọi tên và nói ra cảm xúc.",
    },
    practical: {
      name: "Mũi tên Thực tế (1-4-7)",
      full: "Khéo tay, thích làm việc cụ thể.",
      empty: "Có thể hợp với các trò chơi vận động và làm bằng tay.",
    },
    determination: {
      name: "Mũi tên Quyết tâm (1-5-9)",
      full: "Bền bỉ, theo đuổi mục tiêu.",
      empty: "Có thể cần những mục tiêu nhỏ, dễ đạt.",
    },
    intuition: {
      name: "Mũi tên Nhạy bén (3-5-7)",
      full: "Trực giác tốt, cảm nhận tinh tế.",
      empty: "Có thể tin vào lý lẽ rõ ràng hơn là cảm giác.",
    },
  },
  en: {
    plan: {
      name: "Arrow of planning (1-2-3)",
      full: "Likes order and doing things in sequence.",
      empty: "May like planning step by step with a parent.",
    },
    will: {
      name: "Arrow of will (4-5-6)",
      full: "Persistent, sees things through.",
      empty: "May need encouragement to stick with a choice.",
    },
    action: {
      name: "Arrow of action (7-8-9)",
      full: "Active, acts on ideas.",
      empty: "May need a nudge to get started.",
    },
    mind: {
      name: "Arrow of intellect (3-6-9)",
      full: "Good memory, likes to think and learn.",
      empty: "May learn better by doing than by memorising.",
    },
    emotion: {
      name: "Arrow of emotional balance (2-5-8)",
      full: "Balanced feelings, mixes easily.",
      empty: "May need help naming and voicing feelings.",
    },
    practical: {
      name: "Arrow of practicality (1-4-7)",
      full: "Good with hands, likes concrete tasks.",
      empty: "May enjoy active, hands-on games.",
    },
    determination: {
      name: "Arrow of determination (1-5-9)",
      full: "Steady, pursues goals.",
      empty: "May like small, easy goals.",
    },
    intuition: {
      name: "Arrow of intuition (3-5-7)",
      full: "Good intuition, perceptive.",
      empty: "May trust clear reasons more than feelings.",
    },
  },
};

/** How a digit reads by how often it appears in a chart: once, twice, three times, four or more. */
export type CellMeanings = Record<number, Record<1 | 2 | 3 | 4, string>>;

export const CELL_MEANINGS: Record<Locale, CellMeanings> = {
  vi: {
    1: {
      1: "Có suy nghĩ riêng nhưng chưa dễ nói ra cảm xúc bằng lời.",
      2: "Cân bằng: nói được điều mình nghĩ và biết lắng nghe.",
      3: "Hoạt ngôn, vui vẻ, thích trò chuyện.",
      4: "Nói rất nhiều, có lúc quá mức; cần học cách dừng và nghe.",
    },
    2: {
      1: "Nhạy cảm, có trực giác.",
      2: "Trực giác tốt, hiểu người khác nhanh.",
      3: "Rất nhạy cảm, dễ bị cảm xúc cuốn theo.",
      4: "Nhạy cảm sâu sắc, cần không gian yên tĩnh để cân bằng.",
    },
    3: {
      1: "Trí nhớ tốt, có óc sáng tạo.",
      2: "Tư duy nhanh, giàu tưởng tượng.",
      3: "Rất giàu tưởng tượng, đôi khi hay mơ mộng.",
      4: "Nhiều ý tưởng cùng lúc, cần được giúp tập trung vào từng việc.",
    },
    4: {
      1: "Thực tế, biết sắp xếp.",
      2: "Ngăn nắp, khéo tay.",
      3: "Chăm chỉ, cầu toàn.",
      4: "Dễ cứng nhắc với khuôn khổ; cần thêm thời gian vui chơi tự do.",
    },
    5: {
      1: "Chủ động, yêu tự do.",
      2: "Quyết đoán, mạnh mẽ.",
      3: "Nhiều năng lượng, có lúc bốc đồng.",
      4: "Năng lượng dồi dào, cần nhiều vận động và giới hạn rõ ràng.",
    },
    6: {
      1: "Yêu gia đình, có óc thẩm mỹ.",
      2: "Sáng tạo, chu đáo với người thân.",
      3: "Hay bận tâm cho người khác, cần được trấn an.",
      4: "Gánh nhiều trách nhiệm quá sớm; cần được nhắc rằng mình còn bé.",
    },
    7: {
      1: "Học hỏi qua trải nghiệm thực tế.",
      2: "Suy ngẫm sâu, rút ra bài học riêng.",
      3: "Thích tự mình tìm hiểu, cần được khích lệ chia sẻ.",
      4: "Hay tự xoay xở một mình; cần được đồng hành nhiều hơn khi gặp khó.",
    },
    8: {
      1: "Tỉ mỉ, đáng tin.",
      2: "Độc lập, có chính kiến.",
      3: "Rất độc lập, có lúc khó chịu khi phải thay đổi.",
      4: "Bướng bỉnh khi chưa hiểu lý do; nên giải thích thay vì ép buộc.",
    },
    9: {
      1: "Tốt bụng, có lý tưởng.",
      2: "Thông minh, giàu hoài bão.",
      3: "Có tham vọng, đôi khi khó hài lòng với bản thân.",
      4: "Đặt kỳ vọng cao cho mình; cần được khen nỗ lực nhiều hơn.",
    },
  },
  en: {
    1: {
      1: "Has their own thoughts but does not easily put feelings into words.",
      2: "Balanced: says what they think and listens well.",
      3: "Talkative and cheerful, loves to chat.",
      4: "Talks a lot, sometimes too much; learning to pause and listen.",
    },
    2: {
      1: "Sensitive, with intuition.",
      2: "Good intuition, reads others quickly.",
      3: "Very sensitive, easily carried by feelings.",
      4: "Deeply sensitive, needs quiet space to rebalance.",
    },
    3: {
      1: "Good memory and creativity.",
      2: "Quick thinking, rich imagination.",
      3: "Very imaginative, sometimes dreamy.",
      4: "Many ideas at once; needs help focusing on one thing.",
    },
    4: {
      1: "Practical, likes order.",
      2: "Tidy and good with hands.",
      3: "Hard-working, a perfectionist.",
      4: "Can hold rules too tightly; needs more free play.",
    },
    5: {
      1: "Eager and freedom-loving.",
      2: "Decisive and strong.",
      3: "Full of energy, sometimes impulsive.",
      4: "Abundant energy; needs plenty of movement and clear limits.",
    },
    6: {
      1: "Loves family, has a sense of beauty.",
      2: "Creative, thoughtful with loved ones.",
      3: "Worries about others; needs reassurance.",
      4: "Takes on too much too early; needs reminding they are still small.",
    },
    7: {
      1: "Learns through real experience.",
      2: "Reflects deeply, draws their own lessons.",
      3: "Likes to find out alone; encourage them to share.",
      4: "Copes alone a lot; needs more company when things are hard.",
    },
    8: {
      1: "Careful and reliable.",
      2: "Independent, with opinions.",
      3: "Very independent, sometimes uneasy with change.",
      4: "Stubborn until they understand why; explain rather than insist.",
    },
    9: {
      1: "Kind, with ideals.",
      2: "Bright and ambitious.",
      3: "Ambitious, sometimes hard on themselves.",
      4: "Sets high expectations; needs their effort praised more.",
    },
  },
};

/** What an empty place in the chart invites parents to nurture. */
export const MISSING_MEANINGS: Record<Locale, Record<number, string>> = {
  vi: {
    1: "Thiếu số 1: khích lệ bé nói ra mong muốn và tự làm việc nhỏ.",
    2: "Thiếu số 2: giúp bé gọi tên cảm xúc và để ý cảm xúc của bạn.",
    3: "Thiếu số 3: cùng bé đọc, kể chuyện và chơi trò tưởng tượng.",
    4: "Thiếu số 4: tập cho bé nếp sinh hoạt đều và sắp xếp đồ đạc.",
    5: "Thiếu số 5: cho bé tự chọn và thử sức với việc mới.",
    6: "Thiếu số 6: để bé phụ việc nhà và chăm sóc người thân.",
    7: "Thiếu số 7: cho bé tự trải nghiệm, rồi cùng nói về điều học được.",
    8: "Thiếu số 8: giao việc nhỏ để bé tự làm đến cùng.",
    9: "Thiếu số 9: kể cho bé về lòng tốt, cùng bé giúp người khác.",
  },
  en: {
    1: "No 1: encourage them to say what they want and do small things alone.",
    2: "No 2: help them name feelings and notice how friends feel.",
    3: "No 3: read, tell stories and play pretend together.",
    4: "No 4: build steady routines and tidy up together.",
    5: "No 5: let them choose and try new things.",
    6: "No 6: let them help at home and care for family.",
    7: "No 7: let them try things out, then talk about what they learned.",
    8: "No 8: give small tasks they finish on their own.",
    9: "No 9: tell them about kindness and help others together.",
  },
};

export interface PlaneMeaning {
  readonly name: string;
  /** When this row or column holds the most digits. */
  readonly strong: string;
}

export const PLANE_MEANINGS: Record<Locale, Record<PlaneKey, PlaneMeaning>> = {
  vi: {
    rowMind: { name: "Hàng trí não (3-6-9)", strong: "Thiên về suy nghĩ, ghi nhớ và tưởng tượng." },
    rowHeart: { name: "Hàng cảm xúc (2-5-8)", strong: "Thiên về cảm nhận, trực giác và tình cảm." },
    rowBody: {
      name: "Hàng thể chất (1-4-7)",
      strong: "Thiên về vận động, làm bằng tay và việc cụ thể.",
    },
    colThought: {
      name: "Cột tư duy (1-2-3)",
      strong: "Thích nghĩ trước, lên kế hoạch rồi mới làm.",
    },
    colWill: { name: "Cột ý chí (4-5-6)", strong: "Bền bỉ, đã quyết là theo đến cùng." },
    colAction: {
      name: "Cột hành động (7-8-9)",
      strong: "Thích bắt tay vào làm, học qua việc làm.",
    },
  },
  en: {
    rowMind: {
      name: "Mental row (3-6-9)",
      strong: "Leans to thinking, remembering and imagining.",
    },
    rowHeart: {
      name: "Emotional row (2-5-8)",
      strong: "Leans to feeling, intuition and affection.",
    },
    rowBody: {
      name: "Physical row (1-4-7)",
      strong: "Leans to movement, hands-on and concrete tasks.",
    },
    colThought: { name: "Thought column (1-2-3)", strong: "Likes to think and plan before doing." },
    colWill: { name: "Will column (4-5-6)", strong: "Persistent, follows through once decided." },
    colAction: { name: "Action column (7-8-9)", strong: "Likes to get going and learn by doing." },
  },
};

/** The 5 sits in the middle, on four arrows (4-5-6, 2-5-8, 1-5-9, 3-5-7). */
export const CENTER_FIVE: Record<Locale, { readonly present: string; readonly absent: string }> = {
  vi: {
    present:
      "Có số 5 ở ô giữa: số 5 nằm trên bốn mũi tên, như một điểm tựa giúp cảm xúc và ý chí kết nối với nhau.",
    absent:
      "Không có số 5 ở ô giữa: bốn mũi tên đi qua ô này đều thiếu một điểm. Có thể giúp bé bằng cách cho tự chọn, nói ra cảm xúc và theo đuổi việc mình thích.",
  },
  en: {
    present:
      "A 5 in the middle: it sits on four arrows, an anchor that helps feelings and will work together.",
    absent:
      "No 5 in the middle: the four arrows through it each miss a place. Help by offering choices, naming feelings and letting them pursue what they enjoy.",
  },
};
