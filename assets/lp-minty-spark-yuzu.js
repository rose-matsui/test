(function () {
  window.initMintySparkYuzuLp = function () {
    var $ = window.jQuery;
    if (!$ || typeof $.fn.on !== 'function') {
      console.error('[LP] jQuery is required for initMintySparkYuzuLp');
      return;
    }
    function bindLoad(fn) {
      var run = function () {
        try { fn(); } catch (e) { console.warn('[LP] initMintySparkYuzuLp bindLoad', e); }
      };
      if (document.readyState === 'complete') run();
      else $(window).on('load', run);
    }
    function safeTop(target) {
      try {
        var $el = target && target.jquery ? target : $(target);
        if (!$el || !$el.length) return 0;
        var o = $el.offset();
        return o ? o.top : 0;
      } catch (e) {
        return 0;
      }
    }

    /* --- block 1 --- */
    (function () {
      try {
        var slick_other = $('.other-kit-slider .other-kit__list').slick({
              slidesToShow: 3,
              slidesToScroll: 1,
              arrows: false,
              swipe: true,
              infinite: true,
              dots: true,
              autoplay: true,
              autoplaySpeed: 5000,
              responsive: [
                {
                  breakpoint: 960,
                  settings: {
                    slidesToShow: 2,
                    centerPadding: '17vw'
                  }
                },
              ]
            });

            $('.item-slider.other-kit-slider .slick-next').on('click', function () {
              slick_other.slick('slickNext');
            });
            $('.item-slider.other-kit-slider .slick-prev').on('click', function () {
              slick_other.slick('slickPrev');
            });

            $('.item-slider.other-kit-slider ul li .other-kit__catch').matchHeight();
            $('.item-slider.other-kit-slider ul li .img').matchHeight();
            $('.item-slider.other-kit-slider ul li .name-and-price').matchHeight();
      } catch (e) { console.warn('[LP] initMintySparkYuzuLp block 1', e); }
    })();

    /* --- block 2 --- */
    (function () {
      try {
        var slick_other = $('.other-lineup-slider .other-lineup__list').slick({
              slidesToShow: 3,
              slidesToScroll: 1,
              arrows: false,
              swipe: true,
              infinite: true,
              dots: true,
              autoplay: true,
              autoplaySpeed: 5000,
              responsive: [
                {
                  breakpoint: 960,
                  settings: {
                    slidesToShow: 2,
                    centerPadding: '17vw'
                  }
                },
              ]
            });

            $('.other-lineup-slider .slick-next').on('click', function () {
              slick_other.slick('slickNext');
            });
            $('.other-lineup-slider .slick-prev').on('click', function () {
              slick_other.slick('slickPrev');
            });

            $('.other-lineup-slider ul li .other-kit__catch').matchHeight();
            $('.other-lineup-slider ul li .img').matchHeight();
            $('.other-lineup-slider ul li .name-and-price').matchHeight();
      } catch (e) { console.warn('[LP] initMintySparkYuzuLp block 2', e); }
    })();

    /* --- block 3 --- */
    (function () {
      try {
        $(".fragrance-accordion__wrapper h3 a").on("click", function () {
          $(this).parent().parent().parent().toggleClass("open");
          $(this).parent().parent().parent().find(".fragrance-accordion-more").slideToggle(500);
        });
      } catch (e) { console.warn('[LP] initMintySparkYuzuLp block 3', e); }
    })();

    /* --- block 4 --- */
    (function () {
      try {
        $(".ki-accordion__wrapper h3 a").on("click", function () {
          $(this).parent().parent().parent().toggleClass("open");
          $(this).parent().parent().parent().find(".ki-accordion-more").slideToggle(500);
        });
      } catch (e) { console.warn('[LP] initMintySparkYuzuLp block 4', e); }
    })();

    /* --- block 5 --- */
    (function () {
      try {
        $('.inview').css('opacity', 0);
        $('.inview').one('inview', function (event, isInView) {
          if (isInView) {
            $(this).delay(300).queue(function () {
              $(this).stop().animate({ opacity: 1 }, 500);
            });
          }
        });

        $(".pagetop a").click(function () {
          $("html,body").animate({ scrollTop: 0 }, 600);
        });

        $(".open-menu .btn a,.open-menu .open-menu-list ul li a").click(function () {
          $('.open-menu').toggleClass("open");
        });

        $(window).on('load scroll', function () {

          var pl = $(this).scrollTop();
          if (pl == 0) {
            $(".pagetop").css("display", "none");
          } else {
            $(".pagetop").css("display", "block");
          }

          var menu_pos = $("#SpecialKit").offset().top - 1;

          if (pl >= menu_pos) {
            $('.open-menu-out').addClass("view");
          } else {
            $('.open-menu-out').removeClass("view");
          }
        });

        $(window).on('load scroll', function () {
          var pl = $(this).scrollTop();
          if (pl == 0) {
            $(".pagetop").css("display", "none");
          } else {
            $(".pagetop").css("display", "block");
          }
        });

        bindLoad( function () {
          if (location.hash !== "") {
            var targetOffset = safeTop($(location.hash));
            $(window).delay(1000).scrollTop(targetOffset);
          }
        });

      } catch (e) { console.warn('[LP] initMintySparkYuzuLp block 5', e); }
    })();

    /* inview: 動的読込後も表示する */
    (function () {
      try {
        var $els = $('.inview');
        if (!$els.length) return;
        $els.each(function () {
          var $el = $(this);
          if ($el.data('lpInviewBound')) return;
          $el.data('lpInviewBound', 1);
          $el.one('inview', function (event, isInView) {
            if (isInView) $(this).stop().animate({ opacity: 1 }, 500);
          });
        });
        $(window).trigger('scroll');
      } catch (e) {}
    })();
  };

  window.destroyMintySparkYuzuLp = function () {
    var $ = window.jQuery;
    if (!$) return;
    try {
      $('.slick-initialized').each(function () { $(this).slick('unslick'); });
    } catch (e) {}
    try {
      document.querySelectorAll('.swiper').forEach(function (el) {
        if (el.swiper) el.swiper.destroy(true, true);
      });
    } catch (e) {}
    $('.open-modal').off('click');
    $('.pagetop a').off('click');
  };
})();