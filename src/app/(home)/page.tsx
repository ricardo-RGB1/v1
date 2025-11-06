import Image from "next/image";
import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectList } from "@/modules/home/ui/components/project-list";

const Page = () => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="Joy"
            width={50}
            height={50}
            className="hidden md:block"
          />
      </div>
        <h1 className="text-2xl md:text-5xl font-bold text-center">
          Build anything with Joy
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground text-center">
          Create apps and websites with chatting with AI
        </p>
        <div>
          <div className="max-w-3xl mx-auto w-full">
            <ProjectForm />
          </div>
        </div>
      </section>
      <ProjectList />
    </div>
  );
};

export default Page;
