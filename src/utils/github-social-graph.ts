/* eslint-disable func-names */

import {
  select,
  zoom,
  zoomIdentity,
  forceLink,
  forceCenter,
  forceManyBody,
  forceSimulation,
  BaseType,
  Selection,
  Simulation,
  SimulationNodeDatum,
  ZoomBehavior,
} from 'd3';
import { UserReposQuery } from '../generated/graphql';
import { RepoType, UserType } from '../types/object';

type NodeParam = UserType | RepoType;
type RectType = {
  rect: SVGRect;
};

type ForcedUserType = UserType & SimulationNodeDatum;
type ForcedRepoType = RepoType & SimulationNodeDatum;
type ForcedNode = ForcedUserType & ForcedRepoType & RectType;
type ForcedLink = {
  source: ForcedNode | string;
  target: ForcedNode | string;
};

type RootElement = SVGSVGElement;

const constants = {
  zoom: {
    init: 0.3,
    threshold: 0.5,
    level: {
      min: 0.05,
      max: 2,
    },
  },
  force: {
    decay: 0.08,
    alpha: 0.5,
    strength: -2000,
    distance: 300,
  },
} as const;

export default class GithubSocialGraph extends EventTarget {
  public graph: {
    nodes: ForcedNode[];
    links: ForcedLink[];
  };

  public size: {
    w: number;
    h: number;
  };

  public root: Selection<RootElement, unknown, BaseType, unknown>;

  public group: {
    lines: Selection<SVGGElement, unknown, BaseType, unknown>;
    names: Selection<SVGGElement, unknown, BaseType, unknown>;
    skeletons: Selection<SVGGElement, unknown, BaseType, unknown>;
    avatars: Selection<SVGGElement, unknown, BaseType, unknown>;
  };

  public container: {
    lines: Selection<SVGLineElement, ForcedLink, SVGGElement, unknown> | null;
    names: Selection<SVGGElement, ForcedNode, SVGGElement, unknown> | null;
    skeletons: Selection<SVGCircleElement, ForcedNode, SVGGElement, unknown> | null;
    avatars: Selection<SVGForeignObjectElement, ForcedNode, SVGGElement, unknown> | null;
  };

  private nodeIds: string[];

  private simulation: Simulation<ForcedNode, ForcedLink>;

  private zoom: ZoomBehavior<RootElement, unknown>;

  private isShown: boolean;

  constructor(parent: string) {
    super();

    this.nodeIds = [];
    this.graph = { nodes: [], links: [] };
    this.root = select(parent).select('#network');

    if (this.root.empty()) {
      this.root = select(parent)
        .append<RootElement>('svg:svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('id', 'network');
    }

    this.size = {
      w: parseInt(this.root.style('width'), 10),
      h: parseInt(this.root.style('height'), 10),
    };

    this.group = {
      lines: this.root
        .append<SVGGElement>('svg:g')
        .attr('id', 'lines')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.8),

      names: this.root
        .append<SVGGElement>('svg:g')
        .attr('id', 'names'),

      skeletons: this.root
        .append<SVGGElement>('svg:g')
        .attr('id', 'skeletons')
        .attr('display', 'none'),

      avatars: this.root
        .append<SVGGElement>('svg:g')
        .attr('id', 'avatars'),
    };

    this.container = {
      lines: null,
      names: null,
      skeletons: null,
      avatars: null,
    };

    this.isShown = true;

    this.simulation = forceSimulation<ForcedNode, ForcedLink>()
      .alphaDecay(constants.force.decay)
      .on('tick', this.ticked.bind(this));

    this.zoom = zoom<SVGSVGElement, unknown>()
      .scaleExtent([constants.zoom.level.min, constants.zoom.level.max])
      .on('zoom', this.zoomed.bind(this));

    this.root.call(this.zoom);
  }

  public push(data: UserReposQuery['user']) {
    if (!data || this.nodeIds.includes(data.id)) return;
    const { starredRepositories: repos, ...user } = data;

    if (user) this.addNode(user);
    repos?.nodes?.forEach((repo) => repo && this.connectNodes(user, repo, ({ id }) => id));

    this.updateForce();
    this.updateZoom();
  }

  private addNode(node: UserType | RepoType) {
    if (!this.nodeIds.includes(node.id)) {
      this.graph.nodes.push((node as ForcedNode));
      this.nodeIds.push(node.id);
    }
  }

  private connectNodes(
    aNode: NodeParam,
    bNode: NodeParam,
    keyFn: (node: NodeParam) => string,
  ) {
    this.addNode(aNode);
    this.addNode(bNode);
    this.graph.links.push({
      source: keyFn(aNode),
      target: keyFn(bNode),
    });
  }

  private updateForce() {
    const charge = forceManyBody<ForcedNode>()
      .strength(constants.force.strength);

    const center = forceCenter<ForcedNode>(this.size.w / 2, this.size.h / 2);

    const link = forceLink<ForcedNode, ForcedLink>(this.graph.links)
      .id(({ id }) => id)
      .distance(constants.force.distance);

    this.simulation
      .nodes(this.graph.nodes)
      .force('center', center)
      .force('charge', charge)
      .force('link', link);

    this.drawLines();
    this.drawNames();
    this.drawSkeletons();
    this.drawAvatars();

    this.simulation.alpha(constants.force.alpha).restart();
  }

  private drawLines() {
    this.group.lines.selectAll('.line').remove();
    this.container.lines = this.group.lines
      .selectAll<SVGLineElement, ForcedLink>('line')
      .data(this.graph.links)
      .join<SVGLineElement>('svg:line')
      .classed('line', true)
      .attr('stroke-width', 1);
  }

  private drawNames() {
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    const instance = this;
    this.group.names.selectAll('.name').remove();
    this.container.names = this.group.names
      .selectAll<SVGGElement, ForcedNode>('.name')
      .data(this.graph.nodes)
      .join<SVGGElement>('svg:g')
      .classed('name', true)
      .each(function ({ login, isInOrganization }) {
        select(this)
          .append<SVGRectElement>('svg:rect')
          .attr('transform', () => `translate(0, ${login ? 70 : 0})`)
          .style('fill', () => {
            if (login) return '#845EC2';
            if (isInOrganization) return '#3C859E';
            return '#008F7A';
          });
      })
      .each(function ({ login, name, isInOrganization }) {
        select<BaseType, ForcedNode>(this)
          .append<SVGTextElement>('svg:text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .text(() => (login || name))
          .style('cursor', isInOrganization ? 'default' : 'pointer')
          .attr('transform', () => `translate(0, ${login ? 70 : 0})`)
          .call((selection) => selection.each((node) => {
            /* eslint-disable-next-line no-param-reassign */
            node.rect = this.getBBox();
          }))
          .on('click', instance.clicked.bind(instance));
      })
      .each(function ({ rect: { width, height } }) {
        select(this)
          .selectAll<SVGRectElement, ForcedNode>('rect')
          .attr('width', () => width + 10)
          .attr('height', () => height + 5)
          .attr('rx', () => height / 2)
          .attr('ry', () => height / 2);
      });
  }

  private drawSkeletons() {
    this.group.skeletons.selectAll('.skeleton').remove();
    this.container.skeletons = this.group.skeletons
      .selectAll<SVGCircleElement, ForcedNode>('.skeleton')
      .data(this.graph.nodes.filter(({ login }) => !login))
      .join<SVGCircleElement>('svg:circle')
      .classed('skeleton', true)
      .attr('r', 30)
      .style('fill', '#ccc');
  }

  private drawAvatars() {
    this.group.avatars.selectAll('.avatar').remove();
    this.container.avatars = this.group.avatars
      .selectAll<SVGForeignObjectElement, ForcedNode>('.avatar')
      .data(this.graph.nodes.filter(({ login }) => login))
      .join<SVGForeignObjectElement>('svg:foreignObject')
      .classed('avatar', true)
      .attr('width', 100)
      .attr('height', 100);

    this.container.avatars
      .append('xhtml:img')
      .attr('width', 100)
      .attr('height', 100)
      .attr('src', ({ avatarUrl }) => avatarUrl)
      .style('border-radius', '50%');
  }

  private updateZoom() {
    const zoomTransform = zoomIdentity
      .translate(this.size.w / 3, this.size.h / 3)
      .scale(constants.zoom.init);

    this.root.call(this.zoom.transform, zoomTransform);
  }

  private ticked() {
    const {
      lines, names, skeletons, avatars,
    } = this.container;

    const text = names?.selectAll<SVGTextElement, ForcedNode>('text');
    const rect = names?.selectAll<SVGRectElement, ForcedNode>('rect');

    lines
      ?.attr('x1', (link) => (link.source as ForcedNode).x || 0)
      ?.attr('y1', (link) => (link.source as ForcedNode).y || 0)
      ?.attr('x2', (link) => (link.target as ForcedNode).x || 0)
      ?.attr('y2', (link) => (link.target as ForcedNode).y || 0);

    text
      ?.attr('x', (({ x }) => x || 0))?.attr('y', (({ y }) => y || 0));

    rect
      ?.attr('x', ({ x, rect: { width } }) => (x || 0) - width / 2 - 10 / 2)
      ?.attr('y', ({ y, rect: { height } }) => (y || 0) - height / 2 - 5 / 2);

    skeletons
      ?.attr('cx', ({ x }) => x || 0)?.attr('cy', ({ y }) => y || 0);

    avatars
      ?.attr('x', ({ x }) => (x || 0) - 50)
      ?.attr('y', ({ y }) => (y || 0) - 50);
  }

  private zoomed({ transform }: any) {
    if (
      (transform.k < constants.zoom.threshold && this.isShown)
      || (transform.k > constants.zoom.threshold && !this.isShown)
    ) {
      this.group.names.attr('display', this.isShown ? 'none' : 'inherit');
      this.group.skeletons.attr('display', this.isShown ? 'inherit' : 'none');
      this.isShown = !this.isShown;
    }
    Object.values(this.group).forEach((group) => group.attr('transform', transform));
  }

  private clicked(_: any, node: ForcedNode) {
    if (node.login) {
      const { login: username } = node;
      this.dispatchClickUserEvent(username, node);
    } else {
      const { isInOrganization, owner: { id, login: username } } = node;
      if (isInOrganization) return;
      if (this.nodeIds.includes(id)) {
        const user = this.graph.nodes.find((u) => u.id === id);
        if (user) this.dispatchClickUserEvent(username, user);
      } else {
        this.dispatchClickRepoEvent(username);
      }
    }
  }

  private dispatchClickUserEvent(username: string, node: ForcedNode) {
    this.dispatchEvent(new CustomEvent('click-user', { detail: { username, node } }));
  }

  private dispatchClickRepoEvent(username: string) {
    this.dispatchEvent(new CustomEvent('click-repo', { detail: { username } }));
  }
}
