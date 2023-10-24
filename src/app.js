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
  createMemoryHistory,
  RouterView,
} from 'vue-router';

import css from 'fake-tag';

// create array to populate with styles
const styles = [];

const context = fstyle.context({
  insert: (x) => {
    styles.push(x);
  },
});

function use_fstyle(styler) {
  const classes = ref([]);
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

const routes = [
  {
    path: '/',
    component: h('h1', 'HOME'),
  },
];

export const router = createRouter({
  history:
    typeof document === 'undefined'
      ? createMemoryHistory()
      : createWebHistory(),
  routes,
});

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
          h(
            'style',
            { name: 'fstyle' },
            styles.map((x) => x.statements).join('\n')
          ),
        ]),
        h('body', { class: body_classes.value }, [
          h('h2', { class: demo_classes.value }, 'count: ' + count.value),
          h('button', { onClick: up }, 'Up'),
          h('button', { onClick: down }, 'Down'),
          h(RouterView),
        ]),
      ]);
    };
  },
};

const ultraApp = createSSRApp(app);
ultraApp.use(router);

export default ultraApp;

if (typeof document !== 'undefined') {
  ultraApp.provide('importmap', document.scripts.namedItem('importmap'));
  router.isReady().then(() => ultraApp.mount(document));
}
