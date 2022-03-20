import { UserReposQuery } from '../generated/graphql';

export type UserRepoType = NonNullable<UserReposQuery['user']>;
export type UserType = Omit<UserRepoType, 'starredRepositories'>;
export type RepoType = NonNullable<NonNullable<Pick<UserRepoType, 'starredRepositories'>['starredRepositories']['nodes']>[0]>;
