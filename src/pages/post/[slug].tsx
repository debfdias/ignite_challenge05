import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  if (isFallback) {
    return <span>Carregando...</span>;
  }

  return (
    <>
      <Header />
      <main className={styles.container}>
        {post.data.banner.url ? (<img src={post.data.banner.url} alt={post.data.title} />) : (<></>)} 
        
        <article className={styles.articleBody}>
          <h1>{post.data.title}</h1>
          <div className={styles.articleInfo}>
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
            <div className={styles.readTime}>
              <FiClock size={24} />
              {readingTime} min
            </div>
          </div>
          <div className={styles.content}>
            {post.data.content.map((content, index) => (
              <Fragment key={index}>
                <h2>{content.heading}</h2>
                <div key={index} 
                     dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body)}}
                ></div>
              </Fragment>
            ))}
          </div>

        </article>

      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(result => ({
    params: {
      slug: result.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url ? (response.data.banner.url) : ''
      },
      author: response.data.author,
      content: response.data.content,
      subtitle: response.data.subtitle,
    },
    uid: response.uid,
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 3,
  };
};
