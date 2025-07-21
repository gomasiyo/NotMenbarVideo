(function() {
    console.log("メンバー限定 ytd-rich-item-renderer の削除と左詰めを開始します (Chrome拡張機能版)...");

    // 特定のテキストを含む要素を見つけるヘルパー関数
    function findElementsByText(selector, text) {
        const elements = document.querySelectorAll(selector);
        const result = [];
        elements.forEach(el => {
            if (el.textContent && el.textContent.includes(text)) {
                result.push(el);
            }
        });
        return result;
    }

    // メンバー限定コンテンツを検索し、DOMから削除するメイン関数
    function removeMemberOnlyContentAndCompactLayout() {
        console.log("削除処理実行中：ytd-rich-item-renderer を特定して詰めます...");

        const keywords = ['メンバー限定', 'Members only'];
        let elementsToRemove = new Set(); // 削除対象要素を格納 (重複防止)

        // --- 1. 動画サムネイル上の「メンバー限定」バッジを最優先で特定し、その親の動画コンテナ（特に ytd-rich-item-renderer）を削除 ---
        keywords.forEach(keyword => {
            const richItemRenderers = document.querySelectorAll('ytd-rich-item-renderer');
            richItemRenderers.forEach(itemRenderer => {
                // itemRenderer の内部にメンバー限定のバッジがあるかチェック
                const badgeInItem = findElementsByText('ytd-badge-supported-renderer', keyword);
                let isMemberOnly = false;
                badgeInItem.forEach(badge => {
                    if (itemRenderer.contains(badge)) { // itemRenderer がバッジを含んでいるか
                        isMemberOnly = true;
                        console.log("メンバー限定バッジを発見 (ytd-rich-item-renderer 内):", badge);
                    }
                });

                if (isMemberOnly) {
                    elementsToRemove.add(itemRenderer);
                    console.log("削除対象: メンバー限定の ytd-rich-item-renderer を特定:", itemRenderer);
                }
            });
        });

        // --- 2. 動画再生ページにおける「メンバー限定」のオーバーレイメッセージを特定し、削除 ---
        // (こちらは以前のロジックを維持)
        keywords.forEach(keyword => {
            const messages = findElementsByText('yt-formatted-string', `この動画は${keyword}`)
                .concat(findElementsByText('yt-formatted-string', `This video is for ${keyword.toLowerCase()}`));

            messages.forEach(msg => {
                let overlay = msg.closest('ytd-player-overlay-renderer, #player-container');
                if (overlay) {
                    elementsToRemove.add(overlay);
                    console.log("削除対象: プレイヤーオーバーレイを特定:", overlay);
                } else {
                    elementsToRemove.add(msg);
                    console.log("削除対象: メッセージ要素を特定:", msg);
                }
            });
        });

        // --- 3. コメント欄の「メンバー限定コメント」表示の検出と削除 ---
        // (こちらも以前のロジックを維持)
        const memberOnlyComments = findElementsByText('#comments #message', 'メンバー限定のコメント')
            .concat(findElementsByText('#comments #message', 'Members-only comments'));

        memberOnlyComments.forEach(commentBlock => {
            elementsToRemove.add(commentBlock);
            console.log("削除対象: コメントブロックを特定:", commentBlock);
        });

        // 検出された要素をDOMから削除
        elementsToRemove.forEach(el => {
            if (el && el.parentNode) {
                console.log("DOMから削除実行:", el);
                el.parentNode.removeChild(el);
            }
        });

        console.log("メンバー限定コンテンツの削除とレイアウト調整が完了しました。");
    }

    // --- 初回ロード時の実行 ---
    removeMemberOnlyContentAndCompactLayout();

    // --- 動的ロードへの対応: MutationObserver ---
    const observer = new MutationObserver(mutations => {
        let shouldRun = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 追加されたノードの中に ytd-rich-item-renderer が含まれるか確認
                for (const node of mutation.addedNodes) {
                    if (node instanceof Element && node.matches('ytd-rich-item-renderer')) {
                        shouldRun = true;
                        break;
                    }
                }
            }
        }
        if (shouldRun) {
            setTimeout(() => {
                removeMemberOnlyContentAndCompactLayout();
            }, 500); // 500ミリ秒（0.5秒）のディレイ
        }
    });

    // body要素以下のDOM変更を監視
    observer.observe(document.body, { childList: true, subtree: true });

    // ページ遷移時にも対応（SPAのURL変更を検知）
    let lastUrl = location.href;
    const urlChangeObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log("URL変更を検出、再度コンテンツ削除処理を実行します。");
            setTimeout(removeMemberOnlyContentAndCompactLayout, 500);
        }
    });
    urlChangeObserver.observe(document.head, { childList: true, subtree: true, attributes: true });
    urlChangeObserver.observe(document.body, { childList: true, subtree: true, attributes: true });

})();
