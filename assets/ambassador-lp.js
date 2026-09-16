(function () {
	'use strict';

	
	var navFixedBound = false;
	var navFixedAnchorY = null;
	var navFixedTarget = null;
	var navCurrentBound = false;
	var navScrollBound = false;
	var navScrollOffsetLast = -1;

	function getHeaderStackBottom() {
		var header = document.querySelector('.header');
		var announcement = document.querySelector('.announcement-bar');
		if (header) {
			return Math.max(0, Math.round(header.getBoundingClientRect().bottom));
		}
		if (announcement) {
			return Math.max(0, Math.round(announcement.getBoundingClientRect().bottom));
		}
		return 0;
	}

	function getAnchorScrollOffset() {
		var top = getHeaderStackBottom();
		var nav = document.querySelector('.ambassador_common-nav');
		if (nav) {
			top += nav.offsetHeight;
		}
		return top;
	}

	function initNavFixed() {
		var announcement = document.querySelector('.announcement-bar');
		var header = document.querySelector('.header');

		function getNavigation() {
			return document.querySelector('.ambassador_common-nav');
		}

		function getDocumentTop(el) {
			return el.getBoundingClientRect().top + window.pageYOffset;
		}

		function updateNavigation() {
			var navigation = getNavigation();
			if (!navigation) return;

			if (navFixedTarget !== navigation) {
				if (navFixedTarget) {
					navFixedTarget.classList.remove('ambassador_common-nav--fixed');
					navFixedTarget.style.top = '';
				}
				navFixedTarget = navigation;
				navFixedAnchorY = null;
			}

			var fixedTop = getHeaderStackBottom();
			var isFixed = navigation.classList.contains('ambassador_common-nav--fixed');

			if (!isFixed) {
				navFixedAnchorY = getDocumentTop(navigation);
			}

			if (navFixedAnchorY == null) return;

			if (window.pageYOffset + fixedTop >= navFixedAnchorY) {
				navigation.classList.add('ambassador_common-nav--fixed');
				navigation.style.top = fixedTop + 'px';
			} else {
				navigation.classList.remove('ambassador_common-nav--fixed');
				navigation.style.top = '';
			}
		}

		if (!navFixedBound) {
			navFixedBound = true;
			window.addEventListener('scroll', updateNavigation, { passive: true });
			window.addEventListener('resize', updateNavigation);

			if (typeof ResizeObserver !== 'undefined') {
				var resizeObserver = new ResizeObserver(updateNavigation);
				if (announcement) resizeObserver.observe(announcement);
				if (header) resizeObserver.observe(header);
			}
		}

		updateNavigation();
	}

	function initNavCurrent() {
		function getStickyOffset() {
			var top = getHeaderStackBottom();
			var nav = document.querySelector('.ambassador_common-nav');
			if (nav && nav.classList.contains('ambassador_common-nav--fixed')) {
				top += nav.offsetHeight;
			}
			return top;
		}

		function updateNavCurrent() {
			var nav = document.querySelector('.ambassador_common-nav');
			if (!nav) return;

			var links = nav.querySelectorAll('.ambassador_common-nav__link[href^="#"]');
			if (!links.length) return;

			var offset = getStickyOffset() + 2;
			var currentLink = null;

			links.forEach(function (link) {
				var id = (link.getAttribute('href') || '').slice(1);
				if (!id) return;
				var section = document.getElementById(id);
				if (!section) return;
				if (section.getBoundingClientRect().top <= offset) {
					currentLink = link;
				}
			});

			links.forEach(function (link) {
				var isCurrent = link === currentLink;
				var item = link.closest('.ambassador_common-nav__item');
				link.classList.toggle('ambassador_common-nav__link--current', isCurrent);
				if (item) {
					item.classList.toggle('ambassador_common-nav__item--current', isCurrent);
				}
				if (isCurrent) {
					link.setAttribute('aria-current', 'location');
				} else {
					link.removeAttribute('aria-current');
				}
			});
		}

		if (!navCurrentBound) {
			navCurrentBound = true;
			window.addEventListener('scroll', updateNavCurrent, { passive: true });
			window.addEventListener('resize', updateNavCurrent);
		}

		updateNavCurrent();
	}

	function updateAnchorScrollMargins() {
		var offset = getAnchorScrollOffset();
		if (offset === navScrollOffsetLast) return;
		navScrollOffsetLast = offset;

		document.documentElement.style.scrollPaddingTop = offset + 'px';

		var nav = document.querySelector('.ambassador_common-nav');
		if (!nav) return;

		nav.querySelectorAll('.ambassador_common-nav__link[href^="#"]').forEach(function (link) {
			var id = (link.getAttribute('href') || '').slice(1);
			if (!id) return;
			var section = document.getElementById(id);
			if (section) {
				section.style.scrollMarginTop = offset + 'px';
			}
		});
	}

	function scrollToAnchor(id, behavior) {
		var el = document.getElementById(id);
		if (!el) return;

		var top = el.getBoundingClientRect().top + window.pageYOffset - getAnchorScrollOffset();
		window.scrollTo({
			top: Math.max(0, top),
			behavior: behavior || 'smooth',
		});
	}

	function initNavScrollOffset() {
		navScrollOffsetLast = -1;
		updateAnchorScrollMargins();

		if (!navScrollBound) {
			navScrollBound = true;
			window.addEventListener('resize', updateAnchorScrollMargins);
			window.addEventListener('scroll', updateAnchorScrollMargins, { passive: true });

			window.addEventListener('hashchange', function () {
				var id = (location.hash || '').slice(1);
				if (!id || !document.getElementById(id)) return;
				requestAnimationFrame(function () {
					scrollToAnchor(id, 'auto');
				});
			});

			document.addEventListener('click', function (e) {
				var link = e.target.closest('.ambassador_common-nav__link[href^="#"]');
				if (!link || !isLpElement(link)) return;

				var id = (link.getAttribute('href') || '').slice(1);
				if (!id || !document.getElementById(id)) return;

				e.preventDefault();
				if (history.pushState) {
					history.pushState(null, '', '#' + id);
				} else {
					location.hash = id;
				}
				scrollToAnchor(id, 'smooth');
			});
		}

		var initialId = (location.hash || '').slice(1);
		if (initialId && document.getElementById(initialId)) {
			requestAnimationFrame(function () {
				scrollToAnchor(initialId, 'auto');
			});
		}
	}

	function getLpRoot() {
		return document.getElementById('ambassador-lp-root');
	}

	function qInRoot(selector) {
		var root = getLpRoot();
		return root ? root.querySelectorAll(selector) : [];
	}

	function isLpElement(el) {
		var root = getLpRoot();
		return !!(root && el && root.contains(el));
	}

	function initIntroLines() {
		qInRoot('[data-intro-lines]').forEach(function (el) {
			if (el.dataset.introObserved) return;
			el.dataset.introObserved = '1';

			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				el.classList.add('ambassador_common-intro__lines--visible');
				return;
			}

			var observer = new IntersectionObserver(
				function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							entry.target.classList.add('ambassador_common-intro__lines--visible');
							observer.unobserve(entry.target);
						}
					});
				},
				{ threshold: 0.25 },
			);

			observer.observe(el);
		});
	}

	function destroyRecommendSwiper() {
		qInRoot('.ambassador_common-recommend__slider').forEach(function (root) {
			if (root._mainSwiper) {
				root._mainSwiper.destroy(true, true);
				root._mainSwiper = null;
			}
			if (root._thumbSwiper) {
				root._thumbSwiper.destroy(true, true);
				root._thumbSwiper = null;
			}
			delete root.dataset.swiperInit;
		});
	}

	function initRecommendSwiper() {
		if (typeof Swiper === 'undefined') return;

		var lpRoot = getLpRoot();
		var root = lpRoot && lpRoot.querySelector('.ambassador_common-recommend__slider');

		if (!root || root.dataset.swiperInit) return;

		var thumbEl = root.querySelector('.ambassador_common-recommend__thumb-swiper');

		var mainEl = root.querySelector('.ambassador_common-recommend__main-swiper');

		if (!thumbEl || !mainEl) return;

		root.dataset.swiperInit = '1';

		var thumbSlides = thumbEl.querySelectorAll('.swiper-slide');

		function updateThumbActive(index) {
			thumbSlides.forEach(function (slide, slideIndex) {
				slide.classList.toggle('is-active', slideIndex === index);
			});
		}

		root._thumbSwiper = new Swiper(thumbEl, {
			slidesPerView: 5,
			spaceBetween: 8,
			watchSlidesProgress: true,
		});

		root._mainSwiper = new Swiper(mainEl, {
			loop: true,
			slidesPerView: 1.2,
			spaceBetween: 16,
			centeredSlides: true,
			breakpoints: {
				960: {
					slidesPerView: 2.2,
					spaceBetween: 46,
				},
			},

			navigation: {
				nextEl: root.querySelector('.ambassador_common-recommend__next'),
				prevEl: root.querySelector('.ambassador_common-recommend__prev'),
			},

			on: {
				init: function () {
					updateThumbActive(this.realIndex);
				},

				realIndexChange: function () {
					updateThumbActive(this.realIndex);

					root._thumbSwiper.slideTo(this.realIndex, 300);
				},
			},
		});

		thumbSlides.forEach(function (slide, index) {
			slide.addEventListener('click', function () {
				root._mainSwiper.slideToLoop(index);
				updateThumbActive(index);
			});
		});

		updateThumbActive(0);
	}

	var OPEN_MODAL_SELECTOR =
		'[data-cm-modal]:not([hidden]), [data-making-modal]:not([hidden]), [data-time-modal]:not([hidden]), [data-talk-modal]:not([hidden])';
	var modalHeaderOffsetBound = false;

	function positionModalBelowHeader(modal) {
		if (!modal) return;
		modal.style.top = getHeaderStackBottom() + 'px';
	}

	function updateOpenModalsPosition() {
		qInRoot(OPEN_MODAL_SELECTOR).forEach(positionModalBelowHeader);
	}

	function bindModalHeaderOffset() {
		if (modalHeaderOffsetBound) return;
		modalHeaderOffsetBound = true;

		window.addEventListener('resize', updateOpenModalsPosition);

		if (typeof ResizeObserver !== 'undefined') {
			var resizeObserver = new ResizeObserver(updateOpenModalsPosition);
			var announcement = document.querySelector('.announcement-bar');
			var header = document.querySelector('.header');
			if (announcement) resizeObserver.observe(announcement);
			if (header) resizeObserver.observe(header);
		}
	}

	function openPositionedModal(modal) {
		if (!modal) return;
		bindModalHeaderOffset();
		modal.hidden = false;
		positionModalBelowHeader(modal);
		document.body.style.overflow = 'hidden';
	}

	function closeVideoModal(modal) {
		if (!modal) return;
		modal.hidden = true;
		modal.style.top = '';
		var iframe = modal.querySelector('[data-cm-iframe], [data-making-iframe], [data-time-iframe]');
		if (iframe) iframe.src = '';
		var audio = modal.querySelector('[data-talk-audio]');
		if (audio) {
			audio.pause();
			audio.removeAttribute('src');
			audio.load();
		}
		talkResetControls(modal);
		document.body.style.overflow = '';
	}

	var TALK_ARC_RADIUS = 400;
	// PC: 上弧。±1=24° / ±2=40°
	var TALK_ARC_RADIUS_PC = 670;
	var TALK_ARC_ANGLE_STEP = 15;
	var TALK_ARC_ANGLE_STEP_PC = 24;
	var TALK_ARC_ANGLE_OUTER_PC = 40;
	var TALK_ARC_ROTATE_STEP_PC = 15;
	var TALK_ARC_MAX_OFFSET = 2;
	var TALK_ARC_DURATION = 450;
	var TALK_ARC_OFFSET_Y = [-380, -220.527618, 0, 220, 380];
	var TALK_PC_MQ = '(min-width: 960px)';

	function talkIsPcLayout() {
		return window.matchMedia(TALK_PC_MQ).matches;
	}

	function talkArcRadius() {
		return talkIsPcLayout() ? TALK_ARC_RADIUS_PC : TALK_ARC_RADIUS;
	}

	function talkNormalizeIndex(index, total) {
		if (total <= 0) return 0;
		return ((index % total) + total) % total;
	}

	function talkRingOffset(itemIndex, centerIndex, total) {
		var rel = itemIndex - centerIndex;
		var half = total / 2;
		while (rel > half) rel -= total;
		while (rel <= -half) rel += total;
		return rel;
	}

	function talkStepDelta(fromIndex, toIndex, total) {
		var delta = toIndex - fromIndex;
		if (delta > total / 2) delta -= total;
		if (delta < -total / 2) delta += total;
		return delta;
	}

	function talkPrepareLoopRing(slider) {
		if (slider.dataset.talkLoopReady) return;

		var track = slider.querySelector('[data-talk-arc]');
		var items = slider.querySelectorAll('[data-talk-text-item]');
		if (!track || items.length !== 5) return;

		items.forEach(function (item) {
			var clone = item.cloneNode(true);
			clone.classList.remove('ambassador_common-talk__text-box--active');
			clone.removeAttribute('data-talk-offset');
			track.appendChild(clone);
		});

		slider.dataset.talkLoopReady = '1';
	}

	function talkInitialLoopIndex(slider) {
		var items = slider.querySelectorAll('[data-talk-text-item]');
		var setSize = items.length / 2;
		if (setSize < 1) return 0;

		var logical = parseInt(slider.getAttribute('data-talk-index') || '0', 10);
		return setSize + talkNormalizeIndex(logical, setSize);
	}

	function talkResolveArcAnimation(itemIndex, prevIndex, activeIndex, total, nextSlide, item) {
		var fromOffset = talkRingOffset(itemIndex, prevIndex, total);
		var toOffset = talkRingOffset(itemIndex, activeIndex, total);
		var toAngle = talkOffsetToAngle(toOffset);
		var fromAngle = parseFloat(item.dataset.talkAngle);

		if (isNaN(fromAngle)) {
			fromAngle = talkOffsetToAngle(fromOffset);
		}

		if (Math.abs(fromOffset) > TALK_ARC_MAX_OFFSET && Math.abs(toOffset) <= TALK_ARC_MAX_OFFSET) {
			fromAngle = talkOffsetToAngle(toOffset + (nextSlide ? 1 : -1));
		}
		if (Math.abs(toOffset) > TALK_ARC_MAX_OFFSET && Math.abs(fromOffset) <= TALK_ARC_MAX_OFFSET) {
			toAngle = talkOffsetToAngle(fromOffset + (nextSlide ? -1 : 1));
		}

		return {
			fromOffset: fromOffset,
			toOffset: toOffset,
			fromAngle: fromAngle,
			toAngle: toAngle,
		};
	}

	function talkSideShiftBase() {
		return Math.min(window.innerWidth || 390, 520);
	}

	function talkSideShiftX(absOffset) {
		if (talkIsPcLayout()) return 0;
		if (absOffset < 0.5) return 0;
		var base = talkSideShiftBase();
		var level = Math.min(Math.round(absOffset), 2);
		var shifts = [0, Math.round(base * 0.35), Math.round(base * 0.45)];
		return shifts[level];
	}

	function talkAngleStepRad() {
		var stepDeg = talkIsPcLayout() ? TALK_ARC_ANGLE_STEP_PC : TALK_ARC_ANGLE_STEP;
		return (stepDeg * Math.PI) / 180;
	}

	function talkPcAngleDeg(offset) {
		var abs = Math.abs(offset);
		if (abs <= 1) return offset * TALK_ARC_ANGLE_STEP_PC;
		// ±1=24° 据え置き、±2 は 40°
		var sign = offset < 0 ? -1 : 1;
		var outerStep = TALK_ARC_ANGLE_OUTER_PC - TALK_ARC_ANGLE_STEP_PC;
		return sign * (TALK_ARC_ANGLE_STEP_PC + (abs - 1) * outerStep);
	}

	function talkOffsetToAngle(offset) {
		// SP: 左弧 / PC: 上弧（22時・23時・0時・1時・2時）
		if (talkIsPcLayout()) {
			return -Math.PI / 2 + (talkPcAngleDeg(offset) * Math.PI) / 180;
		}
		var step = talkAngleStepRad();
		return Math.PI - offset * step;
	}

	function talkOffsetToRotate(offset) {
		// PC: 22時=-30° / 23時=-15° / 0時=0° / 1時=15° / 2時=30°
		if (talkIsPcLayout()) {
			return offset * TALK_ARC_ROTATE_STEP_PC;
		}
		return -offset * TALK_ARC_ANGLE_STEP;
	}

	function talkOffsetYAt(offset) {
		var index = Math.round(offset) + TALK_ARC_MAX_OFFSET;
		if (index < 0 || index >= TALK_ARC_OFFSET_Y.length) return 0;
		return TALK_ARC_OFFSET_Y[index];
	}

	function talkOffsetToY(offset) {
		var from = Math.floor(offset);
		var to = Math.ceil(offset);
		if (from === to) return talkOffsetYAt(from);
		var t = offset - from;
		return talkOffsetYAt(from) + (talkOffsetYAt(to) - talkOffsetYAt(from)) * t;
	}

	function talkAngleToXY(angleRad) {
		var radius = talkArcRadius();
		if (talkIsPcLayout()) {
			// 頂点をトラック中央付近に置き、前セクションへのはみ出しを防ぐ
			return {
				x: radius * Math.cos(angleRad),
				y: radius * Math.sin(angleRad) + radius,
			};
		}
		return {
			x: radius + radius * Math.cos(angleRad),
			y: radius * Math.sin(angleRad),
		};
	}

	function talkInterpolateAngle(from, to, t) {
		var tau = Math.PI * 2;
		var diff = to - from;
		// 最短弧で補間（長い円周を回らない）
		while (diff > Math.PI) diff -= tau;
		while (diff < -Math.PI) diff += tau;
		return from + diff * t;
	}

	function talkCancelAnimation(item) {
		if (item._talkAnimFrame) {
			cancelAnimationFrame(item._talkAnimFrame);
			item._talkAnimFrame = null;
		}
		item.classList.remove('ambassador_common-talk__text-box--animating');
	}

	function talkUpdateItemThumb(item, offset) {
		var thumb = item.querySelector('.ambassador_common-talk__text-box-thumb');
		if (!thumb) return;

		var activeSrc = item.getAttribute('data-talk-image') || '';
		var sideSrc = item.getAttribute('data-talk-image-side') || activeSrc;
		var src = Math.abs(offset) < 0.01 ? activeSrc : sideSrc;

		if (thumb.getAttribute('src') !== src) {
			thumb.setAttribute('src', src);
		}
	}

	function talkApplyArcPosition(item, offset, angleRad) {
		var pos = talkAngleToXY(angleRad);
		var absOffset = Math.abs(offset);
		var scale = 1 - absOffset * 0.1;
		var opacity = 1 - absOffset * 0.22;
		// PC: 円弧座標そのまま（線上）。SP: 従来のYテーブル + サイドシフト
		var posX = talkIsPcLayout() ? pos.x : pos.x + talkSideShiftX(absOffset);
		var posY = talkIsPcLayout() ? pos.y : talkOffsetToY(offset);

		item.style.setProperty('--talk-x', posX + 'px');
		item.style.setProperty('--talk-y', posY + 'px');
		item.style.setProperty('--talk-rotate', talkOffsetToRotate(offset) + 'deg');
		item.style.setProperty('--talk-scale', String(Math.max(scale, 0.72)));
		item.style.setProperty('--talk-opacity', String(Math.max(opacity, 0.25)));
		item.setAttribute('data-talk-offset', String(Math.round(offset)));
		item.classList.toggle('ambassador_common-talk__text-box--active', Math.round(offset) === 0);
		item.dataset.talkAngle = String(angleRad);

		if (absOffset > TALK_ARC_MAX_OFFSET + 0.01) {
			item.setAttribute('data-talk-hidden', 'true');
		} else {
			item.removeAttribute('data-talk-hidden');
		}

		talkUpdateItemThumb(item, offset);
	}

	function talkAnimateArcItem(item, fromAngle, toAngle, fromOffset, toOffset, nextSlide) {
		talkCancelAnimation(item);
		item.classList.add('ambassador_common-talk__text-box--animating');
		var start = performance.now();

		function frame(now) {
			var t = Math.min((now - start) / TALK_ARC_DURATION, 1);
			var eased = 1 - Math.pow(1 - t, 3);
			var angle = talkInterpolateAngle(fromAngle, toAngle, eased);
			var offset = fromOffset + (toOffset - fromOffset) * eased;
			talkApplyArcPosition(item, offset, angle);

			if (t < 1) {
				item._talkAnimFrame = requestAnimationFrame(frame);
			} else {
				item._talkAnimFrame = null;
				item.classList.remove('ambassador_common-talk__text-box--animating');
				talkApplyArcPosition(item, toOffset, toAngle);
			}
		}

		item._talkAnimFrame = requestAnimationFrame(frame);
	}

	function updateTalkSlider(slider, index, instant) {
		var items = slider.querySelectorAll('[data-talk-text-item]');
		var total = items.length;
		if (!total) return;

		var prevIndex = parseInt(slider.dataset.talkIndex || '0', 10);
		var activeIndex = talkNormalizeIndex(index, total);
		var delta = talkStepDelta(prevIndex, activeIndex, total);
		var isChange = delta !== 0 && !instant;
		var nextSlide = delta > 0;

		slider.dataset.talkIndex = String(activeIndex);
		items.forEach(function (item, i) {
			var anim = talkResolveArcAnimation(i, prevIndex, activeIndex, total, nextSlide, item);
			var fromOffset = anim.fromOffset;
			var toOffset = anim.toOffset;
			var fromAngle = anim.fromAngle;
			var toAngle = anim.toAngle;

			if (!isChange) {
				talkCancelAnimation(item);
				talkApplyArcPosition(item, toOffset, toAngle);
				return;
			}

			talkAnimateArcItem(item, fromAngle, toAngle, fromOffset, toOffset, nextSlide);
		});
	}

	function bindTalkSwipe(slider, target) {
		var touchStartX = 0;
		var touchStartY = 0;

		target.addEventListener(
			'touchstart',
			function (e) {
				if (!e.touches.length) return;
				touchStartX = e.touches[0].clientX;
				touchStartY = e.touches[0].clientY;
			},
			{ passive: true },
		);

		target.addEventListener(
			'touchend',
			function (e) {
				if (!e.changedTouches.length) return;
				var deltaX = e.changedTouches[0].clientX - touchStartX;
				var deltaY = e.changedTouches[0].clientY - touchStartY;
				if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 40) return;

				var current = parseInt(slider.dataset.talkIndex || '0', 10);
				if (Math.abs(deltaX) >= Math.abs(deltaY)) {
					updateTalkSlider(slider, current + (deltaX < 0 ? 1 : -1));
					return;
				}
				updateTalkSlider(slider, current + (deltaY < 0 ? 1 : -1));
			},
			{ passive: true },
		);
	}

	function initTalkSlider() {
		qInRoot('[data-talk-slider]').forEach(function (slider) {
			if (slider.dataset.talkInit) return;
			slider.dataset.talkInit = '1';

			talkPrepareLoopRing(slider);
			var startIndex = talkInitialLoopIndex(slider);
			updateTalkSlider(slider, startIndex, true);

			slider.querySelectorAll('[data-talk-text-item]').forEach(function (item) {
				item.addEventListener('click', function (e) {
					if (e.target.closest('[data-talk-open]')) return;

					var sliderItems = slider.querySelectorAll('[data-talk-text-item]');
					var index = Array.prototype.indexOf.call(sliderItems, item);
					if (index < 0) return;
					var current = parseInt(slider.dataset.talkIndex || '0', 10);
					if (index === current) return;
					updateTalkSlider(slider, index);
				});
			});

			var arc = slider.querySelector('[data-talk-arc]');
			bindTalkSwipe(slider, arc || slider);
		});

		initTalkAudioControls();

		if (!window._talkResizeBound) {
			window._talkResizeBound = true;
			var talkResizeTimer = null;
			window.addEventListener('resize', function () {
				clearTimeout(talkResizeTimer);
				talkResizeTimer = setTimeout(function () {
					qInRoot('[data-talk-slider]').forEach(function (slider) {
						if (!slider.dataset.talkInit) return;
						var idx = parseInt(slider.dataset.talkIndex || '0', 10);
						updateTalkSlider(slider, idx, true);
					});
				}, 150);
			});
		}
	}

	var DOWNLOAD_HOLD_MS = 600;

	function triggerImageDownload(src, filename) {
		fetch(src)
			.then(function (res) {
				if (!res.ok) throw new Error('fetch failed');
				return res.blob();
			})
			.then(function (blob) {
				var url = URL.createObjectURL(blob);
				var link = document.createElement('a');
				link.href = url;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			})
			.catch(function () {
				var link = document.createElement('a');
				link.href = src;
				link.download = filename;
				link.target = '_blank';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			});
	}

	function initDownloadImages() {
		qInRoot('[data-download-image]').forEach(function (item) {
			if (item.dataset.downloadInit) return;
			item.dataset.downloadInit = '1';

			var img = item.querySelector('[data-download-src]');
			if (!img) return;

			var holdTimer = null;

			function getDownloadMeta() {
				var isPc = window.matchMedia('(min-width: 960px)').matches;
				var srcSp = img.getAttribute('data-download-src');
				var srcPc = img.getAttribute('data-download-src-pc');
				var nameSp = item.getAttribute('data-download-filename');
				var namePc = item.getAttribute('data-download-filename-pc');
				return {
					src: (isPc ? srcPc || srcSp : srcSp) || img.currentSrc || img.src,
					filename: (isPc ? namePc || nameSp : nameSp) || 'download.jpg',
				};
			}

			var section = item.closest('.ambassador_common-download');
			var buttons = section ? section.querySelectorAll('[data-download-button]') : [];

			buttons.forEach(function (button) {
				button.addEventListener('click', function (e) {
					e.preventDefault();
					var meta = getDownloadMeta();
					triggerImageDownload(meta.src, meta.filename);
				});
			});

			function startHold(e) {
				if (e.type === 'mousedown' && e.button !== 0) return;
				cancelHold();
				item.classList.add('ambassador_common-download__item--holding');
				holdTimer = setTimeout(function () {
					holdTimer = null;
					item.classList.remove('ambassador_common-download__item--holding');
					var meta = getDownloadMeta();
					triggerImageDownload(meta.src, meta.filename);
					item.classList.add('ambassador_common-download__item--done');
					setTimeout(function () {
						item.classList.remove('ambassador_common-download__item--done');
					}, 400);
				}, DOWNLOAD_HOLD_MS);
			}

			function cancelHold() {
				if (holdTimer) {
					clearTimeout(holdTimer);
					holdTimer = null;
				}
				item.classList.remove('ambassador_common-download__item--holding');
			}

			item.addEventListener('touchstart', startHold, { passive: true });
			item.addEventListener('mousedown', startHold);
			item.addEventListener('touchend', cancelHold);
			item.addEventListener('touchmove', cancelHold);
			item.addEventListener('touchcancel', cancelHold);
			item.addEventListener('mouseup', cancelHold);
			item.addEventListener('mouseleave', cancelHold);
			item.addEventListener('contextmenu', function (e) {
				e.preventDefault();
			});
		});
	}

	function talkUpdateSeekFill(seek, percent) {
		if (!seek) return;
		var value = Math.max(0, Math.min(100, percent));
		seek.value = String(value);
		seek.style.setProperty('--talk-seek-progress', value + '%');
		seek.setAttribute('aria-valuenow', String(Math.round(value)));
	}

	function talkModalElements(modal) {
		return {
			audio: modal.querySelector('[data-talk-audio]'),
			seek: modal.querySelector('[data-talk-seek]'),
			volume: modal.querySelector('[data-talk-volume]'),
			volumeToggle: modal.querySelector('[data-talk-volume-toggle]'),
			volumePanel: modal.querySelector('[data-talk-volume-panel]'),
		};
	}

	function talkCloseVolumePanel(modal) {
		var els = talkModalElements(modal);
		if (!els.volumePanel || !els.volumeToggle) return;
		els.volumePanel.hidden = true;
		els.volumeToggle.setAttribute('aria-expanded', 'false');
	}

	function talkUpdateVolumeIcon(modal) {
		var els = talkModalElements(modal);
		if (!els.volumeToggle || !els.audio) return;
		var img = els.volumeToggle.querySelector('[data-talk-volume-icon]');
		var muted = els.audio.muted || els.audio.volume === 0;
		if (img) {
			var normalSrc = img.getAttribute('data-volume-src') || img.getAttribute('src') || '';
			var mutedSrc = img.getAttribute('data-volume-muted-src') || normalSrc;
			img.src = muted ? mutedSrc : normalSrc;
		}
		els.volumeToggle.classList.toggle('is-muted', muted);
	}

	function talkResetControls(modal) {
		var els = talkModalElements(modal);
		if (els.seek) {
			talkUpdateSeekFill(els.seek, 0);
			delete els.seek.dataset.dragging;
		}
		if (els.volume) {
			els.volume.value = 1;
		}
		if (els.audio) {
			els.audio.volume = 1;
			els.audio.muted = false;
		}
		talkUpdateVolumeIcon(modal);
		talkCloseVolumePanel(modal);

		var thumbEl = modal.querySelector('[data-talk-modal-thumb]');
		if (thumbEl) {
			thumbEl.removeAttribute('src');
			thumbEl.alt = '';
		}
	}

	function talkBindAudioControls(modal) {
		if (modal.dataset.talkControlsBound) return;
		modal.dataset.talkControlsBound = '1';

		var els = talkModalElements(modal);
		if (!els.audio) return;

		els.audio.addEventListener('timeupdate', function () {
			if (!els.seek || !els.audio.duration || els.seek.dataset.dragging) return;
			talkUpdateSeekFill(els.seek, (els.audio.currentTime / els.audio.duration) * 100);
		});

		els.audio.addEventListener('loadedmetadata', function () {
			talkUpdateSeekFill(els.seek, 0);
		});

		els.audio.addEventListener('volumechange', function () {
			talkUpdateVolumeIcon(modal);
			if (els.volume && !els.audio.muted) {
				els.volume.value = String(els.audio.volume);
			}
		});
	}

	function initTalkAudioControls() {
		qInRoot('[data-talk-modal]').forEach(function (modal) {
			talkBindAudioControls(modal);
		});
	}

	function talkGetPopupImageSrc(trigger) {
		var item = trigger.closest('[data-talk-text-item]');
		return (
			(item && item.getAttribute('data-talk-popup-image')) ||
			trigger.getAttribute('data-talk-popup-image') ||
			(item && item.getAttribute('data-talk-image')) ||
			''
		);
	}

	function talkUpdateModalThumb(modal, trigger) {
		var thumbEl = modal.querySelector('[data-talk-modal-thumb]');
		if (!thumbEl) return;

		var item = trigger.closest('[data-talk-text-item]');
		var popupImage = talkGetPopupImageSrc(trigger);

		if (popupImage) {
			thumbEl.src = popupImage;
			thumbEl.alt = item ? item.getAttribute('data-talk-label') || '' : '';
		} else {
			thumbEl.removeAttribute('src');
			thumbEl.alt = '';
		}
	}

	function talkGetMp3Src(trigger) {
		var item = trigger.closest('[data-talk-text-item]');
		return (
			trigger.getAttribute('data-talk-mp3') ||
			(item && item.getAttribute('data-talk-mp3')) ||
			trigger.getAttribute('data-talk-mp4') ||
			(item && item.getAttribute('data-talk-mp4')) ||
			''
		);
	}

	function openTalkModal(trigger) {
		var section = trigger.closest('.ambassador_common-talk');
		if (!section) return;
		var modal = section.querySelector('[data-talk-modal]');
		var audio = modal.querySelector('[data-talk-audio]');
		var nameEl = modal.querySelector('[data-talk-modal-name]');
		var volume = modal.querySelector('[data-talk-volume]');
		var mp3 = talkGetMp3Src(trigger);
		var item = trigger.closest('[data-talk-text-item]');
		if (!mp3 || !audio) return;

		talkResetControls(modal);
		talkBindAudioControls(modal);

		if (nameEl && item) {
			nameEl.textContent = item.getAttribute('data-talk-label') || '';
		}

		talkUpdateModalThumb(modal, trigger);

		audio.src = mp3;
		audio.load();
		if (volume) {
			audio.volume = parseFloat(volume.value) || 1;
		}

		openPositionedModal(modal);
		audio.play().catch(function () {});
	}

	function parseYoutubeId(value) {
		if (!value) return '';
		value = value.trim();
		if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
		var match = value.match(
			/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=))([a-zA-Z0-9_-]{11})/,
		);
		return match ? match[1] : value;
	}

	function getTimeItemUrl(trigger) {
		return (
			trigger.getAttribute('data-time-item-url') ||
			trigger.getAttribute('data-time-button-1-url') ||
			''
		);
	}

	function getTimeShareUrl(trigger) {
		return (
			trigger.getAttribute('data-time-share-url') ||
			trigger.getAttribute('data-time-button-2-url') ||
			''
		);
	}

	function applyTimeActionLinks(container, itemUrl, shareUrl) {
		if (!container) return;
		var links = container.querySelectorAll('.ambassador_common-time__item-link');
		if (!links.length) return;
		var itemLink = links[0];
		var shareLink = container.querySelector('.ambassador_common-time__item-link--share') || links[1];
		if (itemLink) itemLink.href = itemUrl || '#';
		if (shareLink) {
			shareLink.href = shareUrl || '#';
			if (shareUrl && /^https?:\/\//.test(shareUrl)) {
				shareLink.setAttribute('target', '_blank');
				shareLink.setAttribute('rel', 'noopener noreferrer');
			} else {
				shareLink.removeAttribute('target');
				shareLink.removeAttribute('rel');
			}
		}
	}

	function syncTimeItemActionLinks() {
		qInRoot('.ambassador_common-time__video-trigger[data-time-open]').forEach(function (trigger) {
			var item = trigger.closest('.ambassador_common-time__item');
			if (!item) return;
			applyTimeActionLinks(
				item.querySelector('.ambassador_common-time__item-actions'),
				getTimeItemUrl(trigger),
				getTimeShareUrl(trigger),
			);
		});
	}

	function openTimeModal(trigger) {
		var section = trigger.closest('.ambassador_common-time');
		if (!section) return;
		var modal = section.querySelector('[data-time-modal]');
		var iframe = modal.querySelector('[data-time-iframe]');
		var nameEl = modal.querySelector('[data-time-modal-name]');
		var videoId = parseYoutubeId(trigger.getAttribute('data-time-youtube'));
		if (!videoId || !iframe) return;

		if (nameEl) nameEl.textContent = trigger.getAttribute('data-time-name') || '';
		iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
		applyTimeActionLinks(
			modal.querySelector('.ambassador_common-time__item-actions'),
			getTimeItemUrl(trigger),
			getTimeShareUrl(trigger),
		);

		openPositionedModal(modal);
	}

	function openVideoModal(trigger, sectionSelector, modalAttr, iframeAttr, youtubeAttr) {
		var section = trigger.closest(sectionSelector);
		if (!section) return;
		var modal = section.querySelector('[' + modalAttr + ']');
		var iframe = modal.querySelector('[' + iframeAttr + ']');
		var videoId = parseYoutubeId(trigger.getAttribute(youtubeAttr));
		if (!videoId || !iframe) return;

		iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
		openPositionedModal(modal);
	}

	document.addEventListener('click', function (e) {
		var cmOpen = e.target.closest('[data-cm-open]');
		if (cmOpen && isLpElement(cmOpen)) {
			e.preventDefault();
			openVideoModal(
				cmOpen,
				'.ambassador_common-cm',
				'data-cm-modal',
				'data-cm-iframe',
				'data-cm-youtube',
			);
			return;
		}

		var makingOpen = e.target.closest('[data-making-open]');
		if (makingOpen && isLpElement(makingOpen)) {
			e.preventDefault();
			openVideoModal(
				makingOpen,
				'.ambassador_common-making',
				'data-making-modal',
				'data-making-iframe',
				'data-making-youtube',
			);
			return;
		}

		var timeOpen = e.target.closest('[data-time-open]');
		if (timeOpen && isLpElement(timeOpen)) {
			e.preventDefault();
			openTimeModal(timeOpen);
			return;
		}

		var talkOpen = e.target.closest('[data-talk-open]');
		if (talkOpen && isLpElement(talkOpen)) {
			e.preventDefault();
			openTalkModal(talkOpen);
			return;
		}

		var talkPlay = e.target.closest('[data-talk-play]');
		if (talkPlay && isLpElement(talkPlay)) {
			e.preventDefault();
			var talkModal = talkPlay.closest('[data-talk-modal]');
			var talkAudio = talkModal && talkModal.querySelector('[data-talk-audio]');
			if (talkAudio) talkAudio.play().catch(function () {});
			return;
		}

		var talkPause = e.target.closest('[data-talk-pause]');
		if (talkPause && isLpElement(talkPause)) {
			e.preventDefault();
			var pauseModal = talkPause.closest('[data-talk-modal]');
			var pauseAudio = pauseModal && pauseModal.querySelector('[data-talk-audio]');
			if (pauseAudio) pauseAudio.pause();
			return;
		}

		var talkVolumeToggle = e.target.closest('[data-talk-volume-toggle]');
		if (talkVolumeToggle && isLpElement(talkVolumeToggle)) {
			e.preventDefault();
			var volumeModal = talkVolumeToggle.closest('[data-talk-modal]');
			var volumePanel = volumeModal && volumeModal.querySelector('[data-talk-volume-panel]');
			if (!volumePanel) return;
			var isOpen = talkVolumeToggle.getAttribute('aria-expanded') === 'true';
			volumePanel.hidden = isOpen;
			talkVolumeToggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
			return;
		}

		if (!e.target.closest('[data-talk-volume-wrap]')) {
			qInRoot('[data-talk-modal]:not([hidden])').forEach(function (openModal) {
				talkCloseVolumePanel(openModal);
			});
		}

		var videoClose = e.target.closest(
			'[data-cm-close], [data-making-close], [data-time-close], [data-talk-close]',
		);
		if (videoClose && isLpElement(videoClose)) {
			e.preventDefault();
			var modal = videoClose.closest(
				'[data-cm-modal], [data-making-modal], [data-time-modal], [data-talk-modal]',
			);
			closeVideoModal(modal);
			return;
		}

		
	});

	document.addEventListener('input', function (e) {
		if (e.target.matches('[data-talk-seek]') && isLpElement(e.target)) {
			var seekModal = e.target.closest('[data-talk-modal]');
			var seekAudio = seekModal && seekModal.querySelector('[data-talk-audio]');
			if (!seekAudio || !seekAudio.duration) return;
			e.target.dataset.dragging = '1';
			var seekPercent = parseFloat(e.target.value) || 0;
			talkUpdateSeekFill(e.target, seekPercent);
			seekAudio.currentTime = (seekPercent / 100) * seekAudio.duration;
			return;
		}

		if (!e.target.matches('[data-talk-volume]') || !isLpElement(e.target)) return;
		var modal = e.target.closest('[data-talk-modal]');
		var audio = modal && modal.querySelector('[data-talk-audio]');
		if (!audio) return;
		audio.volume = parseFloat(e.target.value) || 0;
		audio.muted = audio.volume === 0;
		talkUpdateVolumeIcon(modal);
	});

	document.addEventListener('change', function (e) {
		if (e.target.matches('[data-talk-seek]') && isLpElement(e.target)) {
			delete e.target.dataset.dragging;
		}
	});

	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Escape') return;
		qInRoot(OPEN_MODAL_SELECTOR).forEach(function (modal) {
			closeVideoModal(modal);
		});
	});

	

	function initAmbassadorLp() {
		if (!getLpRoot()) return;
		initIntroLines();
		initRecommendSwiper();
		initTalkSlider();
		initDownloadImages();
		initNavFixed();
		initNavCurrent();
		initNavScrollOffset();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initAmbassadorLp);
	} else {
		initAmbassadorLp();
	}
})();

/**
 * Ambassador LP コピーガード（一般ユーザー向け抑止）
 * 完全な防止はできません。既存の LP 操作は妨げない想定です。
 */

(function () {
	'use strict';

	if (window.__ambassadorCopyGuardInit) return;
	window.__ambassadorCopyGuardInit = true;

	function getLpRoot() {
		return document.getElementById('ambassador-lp-root');
	}

	function isEditable(el) {
		if (!el) return false;
		var node = el.nodeType === 1 ? el : el.parentElement;
		if (!node) return false;
		var tag = node.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
		if (node.isContentEditable) return true;
		return !!(node.closest && node.closest('input, textarea, select, [contenteditable="true"]'));
	}

	function isInLp(el) {
		var root = getLpRoot();
		if (!root || !el) return false;
		var node = el.nodeType === 1 ? el : el.parentElement;
		return !!(node && root.contains(node));
	}

	function onContextMenu(e) {
		if (!getLpRoot()) return;
		if (isEditable(e.target)) return;
		if (!isInLp(e.target)) return;
		e.preventDefault();
	}

	function onDragStart(e) {
		if (!getLpRoot()) return;
		if (isEditable(e.target)) return;
		if (!isInLp(e.target)) return;
		e.preventDefault();
	}

	function onSelectStart(e) {
		if (!getLpRoot()) return;
		if (isEditable(e.target)) return;
		if (!isInLp(e.target)) return;
		e.preventDefault();
	}

	function onKeyDown(e) {
		if (!getLpRoot()) return;

		var key = e.key || '';
		var code = e.keyCode || e.which || 0;
		var ctrlOrMeta = e.ctrlKey || e.metaKey;
		var shift = e.shiftKey;
		var alt = e.altKey;

		// F12
		if (key === 'F12' || code === 123) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		// Ctrl+P / Cmd+P
		if (ctrlOrMeta && !shift && !alt && (key === 'p' || key === 'P' || code === 80)) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		// Ctrl+U / Cmd+U（ソース表示）
		if (ctrlOrMeta && !shift && !alt && (key === 'u' || key === 'U' || code === 85)) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		// Ctrl+Shift+I / J / C
		if (ctrlOrMeta && shift && !alt) {
			if (
				key === 'i' ||
				key === 'I' ||
				key === 'j' ||
				key === 'J' ||
				key === 'c' ||
				key === 'C' ||
				code === 73 ||
				code === 74 ||
				code === 67
			) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}

		// Cmd+Option+I / J / C / U
		if (e.metaKey && alt) {
			if (
				key === 'i' ||
				key === 'I' ||
				key === 'j' ||
				key === 'J' ||
				key === 'c' ||
				key === 'C' ||
				key === 'u' ||
				key === 'U' ||
				code === 73 ||
				code === 74 ||
				code === 67 ||
				code === 85
			) {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	}

	function applyImageDraggable() {
		var root = getLpRoot();
		if (!root) return;
		var images = root.querySelectorAll('img');
		for (var i = 0; i < images.length; i++) {
			images[i].setAttribute('draggable', 'false');
		}
	}

	var observer = null;

	function watchDynamicImages() {
		var root = getLpRoot();
		if (!root || observer) return;
		observer = new MutationObserver(function () {
			applyImageDraggable();
		});
		observer.observe(root, { childList: true, subtree: true });
	}

	function initCopyGuard() {
		if (!getLpRoot()) return;
		applyImageDraggable();
		watchDynamicImages();
	}

	document.addEventListener('contextmenu', onContextMenu, true);
	document.addEventListener('dragstart', onDragStart, true);
	document.addEventListener('selectstart', onSelectStart, true);
	document.addEventListener('keydown', onKeyDown, true);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initCopyGuard);
	} else {
		initCopyGuard();
	}
})();
