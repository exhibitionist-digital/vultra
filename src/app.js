// @ts-check

globalThis.__VUE_OPTIONS_API__ = true;
globalThis.__VUE_PROD_DEVTOOLS__ = false;

import fstyle from 'fstyle';

import {
  h,
  shallowRef,
  createSSRApp,
  inject,
  ref,
  watchEffect,
  onUnmounted,
  readonly,
} from 'vue';

import {
  createRouter,
  createWebHistory,
  RouterView,
  RouterLink,
} from 'vue-router';

import css from 'fake-tag';

/** @type {Object.<string, string>} */
const styles = {};

const context = fstyle.context({
  intern: true,
  /**
   * @param {object} x
   * @param {string} x.class
   * @param {string} x.statements
   */
  insert: (x) => {
    styles[x.class] = x.statements;
  },
});

/**
 * @param {any} styler
 * @returns {any}
 */
function use_fstyle(styler) {
  const classes = ref([]);
  /** @type {any} */
  let handle;
  watchEffect(function watcher() {
    const requireable = styler();
    const new_handle = context.require(requireable);
    if (handle !== undefined) {
      handle.release();
    }
    classes.value = new_handle.classes;
    handle = new_handle;
  });
  onUnmounted(function () {
    handle.release();
  });
  return readonly(classes);
}

const demo_styler = fstyle.css(function demo() {
  return css`
    .[] {
      color: pink;
      font-size: 200%;
    }

    @media (max-width: 600px) {.[] {
        color: red;
      }}`;
});

const body_styler = fstyle.css(function demo() {
  return css`
    .[] {
      background: black;
      color: white;
    }`;
});

const nav_styler = fstyle.css(function nav() {
  return css`
    .[] {
      margin: 1em 0;
    }

    .[] a {
      margin-right: 0.5em;
    }`;
});

export const routes = [
  {
    path: '/',
    component: h('h1', 'HOME'),
  },
  {
    path: '/about',
    component: h('h1', 'ABOUT'),
  },
];

/**
 * @param {string} importmap
 */
const ImportMapScript = (importmap) => {
  return h('script', {
    name: 'importmap',
    type: 'importmap',
    innerHTML: importmap,
  });
};

const HydrateScript = () => {
  return h('script', {
    name: 'script',
    type: 'module',
    src: `/app.js`,
  });
};

const app = {
  setup() {
    const importmap = inject('importmap');

    const count = shallowRef(0);
    const body_classes = use_fstyle(() => body_styler());
    const demo_classes = use_fstyle(() => demo_styler());
    const nav_classes = use_fstyle(() => nav_styler());

    function up() {
      count.value++;
    }

    function down() {
      count.value--;
    }

    return function render() {
      return h('html', { lang: 'en' }, [
        h('head', [
          h('title', 'Ultra SSR Vue Example'),
          ImportMapScript(importmap),
          HydrateScript(),
          h('meta', {
            name: 'viewport',
            content: 'width=320, initial-scale=1',
          }),
          h('style', { name: 'fstyle' }, Object.values(styles).join('\n')),
        ]),
        h('body', { class: body_classes.value }, [
          h('h2', { class: demo_classes.value }, 'count: ' + count.value),
          h('button', { onClick: up }, 'Up'),
          h('button', { onClick: down }, 'Down'),
          h('nav', { class: nav_classes.value }, [
            h(RouterLink, { to: '/' }, () => 'Home'),
            h(RouterLink, { to: '/about' }, () => 'About'),
          ]),
          h(RouterView),
        ]),
      ]);
    };
  },
};

const ultraApp = createSSRApp(app);

export default ultraApp;

if (typeof document !== 'undefined') {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });
  ultraApp.use(router);
  ultraApp.provide('importmap', document.scripts.namedItem('importmap'));
  // @ts-ignore document
  router.isReady().then(() => ultraApp.mount(document));
}
