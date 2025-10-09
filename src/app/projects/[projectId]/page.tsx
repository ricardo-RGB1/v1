interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const { projectId } = await params;

  return (
    <div>
      <h1>Project: {projectId}</h1>
    </div>
  );
};


export default Page;