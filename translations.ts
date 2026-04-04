export type Language = 'en' | 'zh';

export const translations = {
  en: {
    nav: {
      compress: 'Compress',
      convert: 'Convert',
      video: 'Video Tools',
      mergePdf: 'Merge PDF',
      appName: 'Orion Compress X',
      signIn: 'Sign In',
      logout: 'Logout'
    },
    hero: {
      compressTitle: 'Smart Image Compression',
      compressDesc: 'Reduce file size intelligently without visible quality loss. Batch process unlimited images.',
      convertTitle: 'Universal Image Conversion',
      convertDesc: 'Convert between WebP, JPG, PNG and more instantly in your browser.',
      videoTitle: 'Universal Media Downloader',
      videoDesc: 'Download video (MP4) or extract audio (MP3) from YouTube, Vimeo, TikTok, Instagram, and more.',
      mergePdfTitle: 'Lossless PDF Merger',
      mergePdfDesc: 'Combine multiple PDF files into one without losing original quality.'
    },
    auth: {
      signInTitle: 'Welcome Back',
      signUpTitle: 'Create Account',
      nameLabel: 'Full Name',
      namePlaceholder: 'John Doe',
      accountLabel: 'Email or Phone',
      emailLabel: 'Email',
      accountPlaceholder: 'name@example.com or +1...',
      emailPlaceholder: 'name@example.com',
      phoneLabel: 'Phone Number',
      passwordLabel: 'Password',
      confirmPasswordLabel: 'Confirm Password',
      signInBtn: 'Sign In',
      signUpBtn: 'Create Account',
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      signUpLink: 'Sign up',
      signInLink: 'Sign in',
      optional: 'Optional'
    },
    limits: {
      guestLimit: 'Guest Daily Limit Reached',
      guestLimitDesc: 'You have used your free daily allowance. Please sign in to continue.',
      loginBtn: 'Sign In / Register',
      userLimit: 'Daily Limit Reached',
      userLimitDesc: 'You have reached the daily limit for this feature.',
      remaining: 'Remaining today: '
    },
    uploader: {
      title: 'Click, Paste, or Drop files here',
      sub: 'Supports JPG, PNG, WEBP, GIF, BMP, PDF',
      paste: 'CMD+V',
      drag: 'Drag & Drop'
    },
    compressor: {
      level: 'Compression Strength',
      quality: 'Quality',
      maxComp: 'Max Compression',
      maxQual: 'Max Quality',
      target: 'Target Format',
      compressBtn: 'Compress {n} Files',
      convertBtn: 'Convert {n} Files',
      reCompressBtn: 'Re-Compress {n} Files',
      reConvertBtn: 'Re-Convert {n} Files',
      downloadAll: 'Download All',
      original: 'Original',
      optimized: 'Optimized',
      converted: 'Converted',
      saved: 'Saved',
      increased: 'Increased by',
      sizeIncreaseTip: 'Size increase is often due to format characteristics (e.g. PNG). Try JPG or WebP for smaller size.',
      download: 'Download',
      copy: 'Copy',
      ready: 'Ready',
      error: 'Error',
      copied: 'Copied!',
      copyFail: 'Failed',
      pdfMaxMB: 'Target Size (MB)',
      pdfWarning: 'PDF compression uses an image-based conversion method. Text will no longer be selectable.'
    },
    pdfMerger: {
      mergeBtn: 'Merge {n} PDFs',
      downloadBtn: 'Download Merged PDF',
      processing: 'Merging...',
      ready: 'Merged successfully',
      error: 'Error merging PDFs',
      moveUp: 'Move Up',
      moveDown: 'Move Down',
      remove: 'Remove'
    },
    media: {
      inputPlaceholder: 'Paste video URL here (e.g., youtube.com...)',
      mp4Btn: 'Convert to MP4',
      mp4Desc: 'HD Video',
      mp3Btn: 'Convert to MP3',
      mp3Desc: 'High Quality Audio',
      verify: 'Verifying Link...',
      processing: 'Converting...',
      start: 'Start Download',
      complete: 'Conversion Complete',
      readyMsg: 'Your {type} file is ready.',
      downloadBtn: 'Download {type}',
      another: 'Convert Another',
      error: 'Invalid URL. Please enter a valid link from YouTube, Vimeo, TikTok, or Instagram.'
    },
    footer: {
      desc: 'Professional media processing tools. Supports English & Chinese for global accessibility.',
      rights: 'Sam Yao'
    }
  },
  zh: {
    nav: {
      compress: '图片压缩',
      convert: '格式转换',
      video: '视频工具',
      mergePdf: '合并 PDF',
      appName: 'Orion 压缩大师',
      signIn: '登录',
      logout: '退出'
    },
    hero: {
      compressTitle: '智能图片压缩',
      compressDesc: '智能降低文件大小，肉眼无损画质。支持无限量批量处理。',
      convertTitle: '万能格式转换',
      convertDesc: '浏览器内极速转换 WebP, JPG, PNG 等多种格式。',
      videoTitle: '万能媒体下载器',
      videoDesc: '支持从 YouTube, Vimeo, TikTok, Instagram 等平台下载视频 (MP4) 或提取音频 (MP3)。',
      mergePdfTitle: '无损 PDF 合并',
      mergePdfDesc: '将多个 PDF 文件合并为一个，保持原始质量不变。'
    },
    auth: {
      signInTitle: '欢迎回来',
      signUpTitle: '创建账号',
      nameLabel: '昵称',
      namePlaceholder: '您的昵称',
      accountLabel: '邮箱或手机号',
      emailLabel: '邮箱',
      accountPlaceholder: 'name@example.com 或 +86...',
      emailPlaceholder: 'name@example.com',
      phoneLabel: '手机号',
      passwordLabel: '密码',
      confirmPasswordLabel: '确认密码',
      signInBtn: '登录',
      signUpBtn: '注册账号',
      noAccount: "还没有账号？",
      hasAccount: "已有账号？",
      signUpLink: '去注册',
      signInLink: '去登录',
      optional: '可选'
    },
    limits: {
      guestLimit: '今日免费额度已用完',
      guestLimitDesc: '您的游客免费额度已耗尽。登录后可获取更多使用权限。',
      loginBtn: '登录 / 注册',
      userLimit: '今日限额已达',
      userLimitDesc: '您已达到该功能的今日使用上限。',
      remaining: '今日剩余：'
    },
    uploader: {
      title: '点击、粘贴或拖拽文件到这里',
      sub: '支持 JPG, PNG, WEBP, GIF, BMP, PDF',
      paste: '粘贴',
      drag: '拖拽'
    },
    compressor: {
      level: '压缩强度',
      quality: '质量',
      maxComp: '最大压缩',
      maxQual: '最佳画质',
      target: '目标格式',
      compressBtn: '压缩 {n} 个文件',
      convertBtn: '转换 {n} 个文件',
      reCompressBtn: '重新压缩 {n} 个文件',
      reConvertBtn: '重新转换 {n} 个文件',
      downloadAll: '下载全部',
      original: '原始大小',
      optimized: '压缩后',
      converted: '转换后',
      saved: '节省',
      increased: '体积增加',
      sizeIncreaseTip: '体积增加是因为图片格式本身的特性造成的。如果换到 JPG 或 WebP 通常会更小。',
      download: '下载',
      copy: '复制',
      ready: '完成',
      error: '错误',
      copied: '已复制',
      copyFail: '失败',
      pdfMaxMB: '目标最大体积 (MB)',
      pdfWarning: 'PDF 压缩会在前端将其转换为全图像格式，原始的可选中文字将变为图片（不再可被鼠标拖选复制），但换取的是极高的体积缩减和符合目标大小。'
    },
    pdfMerger: {
      mergeBtn: '合并 {n} 个 PDF',
      downloadBtn: '下载合并后的 PDF',
      processing: '合并中...',
      ready: '合并成功',
      error: '合并错误',
      moveUp: '上移',
      moveDown: '下移',
      remove: '移除'
    },
    media: {
      inputPlaceholder: '在此粘贴视频链接 (例如 youtube.com...)',
      mp4Btn: '转为 MP4',
      mp4Desc: '高清视频',
      mp3Btn: '转为 MP3',
      mp3Desc: '高品质音频',
      verify: '验证链接中...',
      processing: '转换中...',
      start: '开始下载',
      complete: '转换完成',
      readyMsg: '您的 {type} 文件已准备就绪。',
      downloadBtn: '下载 {type}',
      another: '转换下一个',
      error: '无效链接。请输入有效的 YouTube, Vimeo, TikTok 或 Instagram 链接。'
    },
    footer: {
      desc: '专业的媒体处理工具。支持中英文切换，服务全球用户。',
      rights: 'Sam Yao'
    }
  }
};
