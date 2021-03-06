import { format } from 'date-fns';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(
    postsPagination.next_page
  );

  async function handleGetMorePosts(): Promise<void> {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(({ results, next_page }) => {
        setPosts(results);
        setNextPageUrl(next_page);
      })
      .catch(() =>
        toast.error(
          'Ops! Houve um problema ao buscar mais posts. Tente novamente mais tarde.'
        )
      );
  }

  return (
    <main className={`${commonStyles.container} ${styles.homePage}`}>
      <img src="/images/logo.svg" alt="logo" />

      {posts.map(post => (
        <Link href={`/post/${post.uid}`} key={post.uid}>
          <a className={styles.postOverview}>
            <article className={styles.postOverviewContent}>
              <h2>{post.data.title}</h2>
              <h3>{post.data.subtitle}</h3>

              <footer className={styles.postOverviewContentFooter}>
                <div>
                  <FiCalendar />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy'
                    ).toLowerCase()}
                  </span>
                </div>

                <div>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </footer>
            </article>
          </a>
        </Link>
      ))}

      {nextPageUrl && (
        <button
          type="button"
          className={styles.carregarMaisPosts}
          onClick={handleGetMorePosts}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    fetch: [
      'uid',
      'post.title',
      'post.subtitle',
      'post.author',
      'last_publication_date',
    ],
    pageSize: 3,
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
