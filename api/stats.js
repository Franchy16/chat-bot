import { loadKnowledgeBase, verifyJwt } from './_utils.js';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDayKey(d) {
  const x = startOfDay(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default async function handler(req, res) {
  const user = verifyJwt(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const knowledgeBase = loadKnowledgeBase();
    const total = knowledgeBase.length;
    const withCreatedAt = knowledgeBase.filter((x) => x.createdAt).length;
    const withUpdatedAt = knowledgeBase.filter((x) => x.updatedAt).length;

    const days = 14;
    const now = new Date();
    const dayKeys = [];
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - i);
      dayKeys.push(formatDayKey(dt));
    }

    const createdByDay = Object.fromEntries(dayKeys.map((k) => [k, 0]));
    const updatedByDay = Object.fromEntries(dayKeys.map((k) => [k, 0]));

    for (const item of knowledgeBase) {
      if (item.createdAt) {
        const k = formatDayKey(item.createdAt);
        if (k in createdByDay) createdByDay[k] += 1;
      }
      if (item.updatedAt) {
        const k = formatDayKey(item.updatedAt);
        if (k in updatedByDay) updatedByDay[k] += 1;
      }
    }

    const latest = [...knowledgeBase]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10)
      .map((x) => ({
        id: x.id,
        keyword: x.keyword,
        createdAt: x.createdAt || null,
        updatedAt: x.updatedAt || null
      }));

    const topLongestAnswers = [...knowledgeBase]
      .map((x) => ({ id: x.id, keyword: x.keyword, len: (x.answer || '').length }))
      .sort((a, b) => b.len - a.len)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totals: { total, withCreatedAt, withUpdatedAt },
        chart: {
          days: dayKeys,
          created: dayKeys.map((k) => createdByDay[k]),
          updated: dayKeys.map((k) => updatedByDay[k])
        },
        latest,
        topLongestAnswers
      }
    });
  } catch (e) {
    console.error('Stats error (serverless):', e);
    res.status(500).json({ success: false, error: 'Lỗi khi lấy thống kê' });
  }
}


