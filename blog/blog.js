// Shared HeyCatch blog API client for the RxAlarms site.
// API docs: HeyCatch "AI builder" integration (api.heycatch.ai/v1).
(function () {
  var API_BASE = "https://api.heycatch.ai/v1/";

  function apiUrl(path, params) {
    var url = new URL(API_BASE + path);
    if (params) {
      Object.keys(params).forEach(function (k) {
        url.searchParams.set(k, params[k]);
      });
    }
    url.searchParams.set("key", window.HEYCATCH_API_KEY || "");
    return url.toString();
  }

  async function listArticles() {
    var all = [];
    var offset = 0;
    var limit = 50;
    var total = Infinity;

    while (offset < total) {
      var res = await fetch(apiUrl("articles", { limit: limit, offset: offset }));
      if (!res.ok) {
        throw new Error("HeyCatch API error " + res.status);
      }
      var data = await res.json();
      if (!Array.isArray(data.articles) || typeof data.total !== "number") {
        throw new Error("Unexpected HeyCatch API response");
      }
      all = all.concat(data.articles);
      total = data.total;
      if (data.articles.length === 0) break;
      offset += limit;
    }

    var seen = {};
    return all.filter(function (a) {
      if (seen[a.slug]) return false;
      seen[a.slug] = true;
      return true;
    });
  }

  async function getArticle(slug) {
    var res = await fetch(apiUrl("articles/" + encodeURIComponent(slug)));
    if (res.status === 404) {
      return { article: null, notFound: true };
    }
    if (!res.ok) {
      throw new Error("HeyCatch API error " + res.status);
    }
    var data = await res.json();
    return { article: data.article, notFound: false };
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  window.HeyCatchBlog = {
    listArticles: listArticles,
    getArticle: getArticle,
    formatDate: formatDate,
    escapeHtml: escapeHtml
  };
})();
