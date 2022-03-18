/* eslint-disable func-names */

import * as d3 from 'd3';
import {
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
  source: ForcedNode | string | number;
  target: ForcedNode | string | number;
};

const constants = {
  zoom: {
    init: 0.3,
    threshold: 0.5,
    level: {
      min: 0.1,
      max: 2,
    },
  },
  force: {
    decay: 0.05,
    alpha: 0.5,
    strength: -3000,
    distance: 500,
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

  public svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;

  public container: {
    lines: Selection<BaseType | SVGLineElement, ForcedLink, BaseType, unknown> | null;
    names: Selection<BaseType | SVGGElement, ForcedNode, BaseType, unknown> | null;
    skeletons: Selection<BaseType | SVGGElement, ForcedNode, BaseType, unknown> | null;
    avatars: Selection<BaseType | SVGGElement, ForcedNode, BaseType, unknown> | null;
  };

  private nodeIds: string[];

  private simulation: Simulation<ForcedNode, ForcedLink>;

  private zoom: ZoomBehavior<SVGSVGElement, unknown>;

  private isShown: boolean;

  constructor(parent: string) {
    super();

    this.graph = {
      nodes: [],
      links: [],
    };

    this.nodeIds = [];

    this.svg = d3.select(parent).select('#network');
    if (this.svg.empty()) {
      this.svg = d3
        .select(parent)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('id', 'network');
    }

    this.svg.append('g').attr('id', 'lines').attr('stroke', '#999').attr('stroke-opacity', 0.8);
    this.svg.append('g').attr('id', 'names');
    this.svg.append('g').attr('id', 'skeletons').attr('display', 'none');
    this.svg.append('g').attr('id', 'avatars');

    this.size = {
      w: parseInt(this.svg.style('width'), 10),
      h: parseInt(this.svg.style('height'), 10),
    };

    this.container = {
      lines: null,
      names: null,
      skeletons: null,
      avatars: null,
    };

    this.isShown = true;

    this.simulation = d3
      .forceSimulation<ForcedNode, ForcedLink>()
      .alphaDecay(constants.force.decay);

    this.simulation.on('tick', this.tick.bind(this));

    const lines = this.group('lines');
    const names = this.group('names');
    const skeletons = this.group('skeletons');
    const avatars = this.group('avatars');

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([constants.zoom.level.min, constants.zoom.level.max])
      .on('zoom', ({ transform }) => {
        if (
          (transform.k < constants.zoom.threshold && this.isShown)
          || (transform.k > constants.zoom.threshold && !this.isShown)
        ) {
          names.attr('display', this.isShown ? 'none' : 'inherit');
          skeletons.attr('display', this.isShown ? 'inherit' : 'none');
          this.isShown = !this.isShown;
        }
        [lines, names, skeletons, avatars].forEach((group) => group.attr('transform', transform));
      });
  }

  public push(data: UserReposQuery['user']) {
    if (!data) return;
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
    keyFn: (node: NodeParam) => string | number,
  ) {
    this.addNode(aNode);
    this.addNode(bNode);
    this.graph.links.push({
      source: keyFn(aNode),
      target: keyFn(bNode),
    });
  }

  private updateForce() {
    const charge = d3.forceManyBody().strength(constants.force.strength);
    const center = d3.forceCenter(this.size.w / 2, this.size.h / 2);
    const link = d3
      .forceLink<ForcedNode, ForcedLink>(this.graph.links)
      .id(({ id }) => id)
      .distance(constants.force.distance);

    this.simulation
      .nodes(this.graph.nodes)
      .force('charge', charge)
      .force('link', link)
      .force('center', center);

    this.drawLines();
    this.drawNames();
    this.drawSkeletons();
    this.drawAvatars();

    this.simulation.alpha(constants.force.alpha).restart();
  }

  private drawLines() {
    const lines = this.svg.select('#lines');
    lines.selectAll('line').remove();
    this.container.lines = lines
      .selectAll('line')
      .data(this.graph.links)
      .join('line')
      .attr('stroke-width', 1);
  }

  private drawNames() {
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    const instance = this;
    const names = this.svg.select('#names');
    names.selectAll('g').remove();
    this.container.names = names
      .selectAll('text')
      .data(this.graph.nodes)
      .join('g')
      .each(function ({ login }) {
        d3.select(this)
          .append('rect')
          .style('cursor', () => (login ? 'auto' : 'pointer'))
          .attr('transform', () => `translate(0, ${login ? 40 : 0})`)
          .style('fill', () => (login ? 'purple' : '#222'));
      })
      .each(function ({ login, name }) {
        (d3.select(this) as Selection<BaseType, ForcedNode, null, unknown>)
          .append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .text(() => (login || name))
          .style('cursor', () => (login ? 'auto' : 'pointer'))
          .attr('transform', () => `translate(0, ${login ? 40 : 0})`)
          .call((selection) => selection.each((node) => {
            /* eslint-disable-next-line no-param-reassign */
            node.rect = (this as SVGGElement).getBBox();
          }))
          .on('click', (_, { owner: { login: username } }) => {
            instance.dispatchEvent(new CustomEvent('click-repo', { detail: { username } }));
          });
      })
      .each(function ({ rect: { width, height } }) {
        d3.select(this)
          .selectAll('rect')
          .attr('width', () => width + 10)
          .attr('height', () => height + 5)
          .attr('rx', () => height / 2)
          .attr('ry', () => height / 2);
      });
  }

  private drawSkeletons() {
    const skeletons = this.svg.select('#skeletons');
    skeletons.selectAll('circle').remove();
    this.container.skeletons = skeletons
      .selectAll('text')
      .data(this.graph.nodes.filter(({ login }) => !login))
      .join('circle')
      .attr('r', 30)
      .style('fill', '#ccc');
  }

  private drawAvatars() {
    const avatars = this.svg.select('#avatars');
    avatars.selectAll('foreignObject').remove();
    this.container.avatars = avatars
      .selectAll('circle')
      .data(this.graph.nodes.filter(({ login }) => login))
      .join('foreignObject')
      .attr('width', 50)
      .attr('height', 50);

    this.container.avatars
      .append('xhtml:img')
      .attr('width', 50)
      .attr('height', 50)
      .attr('src', ({ avatarUrl }) => avatarUrl)
      .style('border-radius', '50%');
  }

  private updateZoom() {
    const zoomTransform = d3
      .zoomIdentity
      .translate(this.size.w / 2, this.size.h / 2)
      .scale(constants.zoom.init);

    this.svg.call(this.zoom).call(this.zoom.transform, zoomTransform);
  }

  private tick() {
    this.container.avatars?.attr('x', ({ x }) => (x || 0) - 25).attr('y', ({ y }) => (y || 0) - 25);

    const text: Selection<BaseType, ForcedNode, BaseType, unknown> | undefined = this.container.names?.selectAll('text');
    const rect: Selection<BaseType, ForcedNode, BaseType, unknown> | undefined = this.container.names?.selectAll('rect');

    text?.attr('x', (({ x }) => x || 0))?.attr('y', (({ y }) => y || 0));
    rect
      ?.attr('x', ({ x, rect: { width } }) => (x || 0) - width / 2 - 10 / 2)
      ?.attr('y', ({ y, rect: { height } }) => (y || 0) - height / 2 - 5 / 2);

    this.container.skeletons?.attr('cx', ({ x }) => x || 0)?.attr('cy', ({ y }) => y || 0);
    this.container.lines
      ?.attr('x1', (link) => (link.source as ForcedNode).x || 0)
      ?.attr('y1', (link) => (link.source as ForcedNode).y || 0)
      ?.attr('x2', (link) => (link.target as ForcedNode).x || 0)
      ?.attr('y2', (link) => (link.target as ForcedNode).y || 0);
  }

  private group(name: keyof GithubSocialGraph['container']) {
    return this.svg.select(`#${name}`);
  }
}
