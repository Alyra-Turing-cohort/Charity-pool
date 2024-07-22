import RewardList from "./RewardList";

const Index: React.FC = async () => {
  return (
    <div className="w-full h-screen flex justify-center items-center ">
      <div className="max-w-md bg-transparent  text-black dark:text-white rounded-lg shadow-lg border border-0.5 border-gray-300 dark:border-gray-800 p-[1.25rem]">
        <RewardList />
      </div>
    </div>
  );
};

export default Index;
