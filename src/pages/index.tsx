import { useState } from 'react';
import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Header from '../components/Header';
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

export default function Home({ postsPagination }: HomeProps) {
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string>(next_page);

  function handleLoadPosts() {
    if (nextPage) {
      fetch(nextPage)
        .then(response => response.json())
        .then(data => {
          const newPosts = data.results.map((post: Post) => ({
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          }));

          setPosts([...posts, ...newPosts]);
          setNextPage(data.next_page);
        })
        .catch(() => {
          alert("Algo deu errado!");
        });
    }
  }
  
  return (
    <>
    <Header />
      <main className={styles.container}>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div className={styles.time}>
                <time>
                  <FiCalendar size={24} />
                  {format(new Date(post.first_publication_date), 'dd MMM u', {
                    locale: ptBR,
                  })}
                </time>
                <div className={styles.author}>
                  <FiUser size={24} />
                  {post.data.author}
                </div>
              </div>
            </a>
          </Link>
        ))}
        {nextPage && (
          <strong className={styles.load} onClick={handleLoadPosts}>
            Carregar mais posts
          </strong>
        )}
      </main>
    </>
    
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', 
  {
    pageSize: 2,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 5          //5 minutos
  }
};
